import http from 'http';
import { Transform } from 'node:stream';
import express from 'express';
import bodyParser from 'body-parser';

const port = Number(process.argv[2]) || 5000
const controllerPort = Number(process.argv[3]) || 8000;
const target = process.argv[4];

console.log('port', port, 'controllerPort', controllerPort, 'target', target);


// each command has an id
// a deadline
// and a callback
let activeCommands = [];
setInterval(removeExpiredCommands, 1000);

function createPipeline() {
  if (!activeCommands.length) {
    return createPassthroughTransform();
  }

  const transforms = activeCommands.map(cmd => cmd.createTransform(cmd.rawCmd));
  console.log('t', transforms[0]);
  return transforms.reduce((prev, current) => prev.pipe(current));
}

function createPassthroughTransform() {
  return new Transform({
    transform(chunk, encoding, cb) {
      cb(null, chunk);
    }
  });
}

function createDelay(interval) {
  return new Transform({
    transform(chunk, encoding, callback) {
      setTimeout(() => {
        console.log(`delaying response for ${interval}s`);
        callback(null, chunk);
      }, interval * 1000);
    }
  })
}

function createNoResponseTransform() {
  return new Transform({
    transform(chunk, encoding, callback) {
      console.log('blocking response');
    }
  })
}

// Create the server that will act as the forward proxy
const proxyServer = http.createServer((req, res) => {
  // Extract the hostname and port from the request URL
  const [hostname, port] = target.split(':');

  // Create a new request to the desired destination
  const options = {
    hostname,
    port,
    path: req.url,
    method: req.method,
    headers: req.headers
  };

  const proxyReq = http.request(options, (proxyRes) => {
    // Forward the response from the destination to the client
    console.log('read response from target')
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(createPipeline()).pipe(res);
  });

  // Forward the request body from the client to the destination
  req.pipe(proxyReq);
});

// Start the server
proxyServer.listen(port, () => {
  console.log(`Proxy listening on port ${port} to ${target}`);
});

const commandServer = express();
commandServer.use(bodyParser.json());
commandServer.post('/command', (req, res) => {
  console.log('received command request', req.body);
  const command = createCommand(req.body);
 
  activeCommands.push(command);
  res.status(200).json({ ok: true });
});


commandServer.listen(controllerPort, () => {
  console.log(`Listening to commands on port ${controllerPort}`);
})

function createCommand(args) {
  const command = {
    id: args.id,
    deadline: new Date(new Date().getTime() + args.duration * 1000),
    rawCmd: args,
    createTransform: rawCmd => createCommandCallback(rawCmd)
  }

  return command
}

function createCommandCallback(args) {
  if (args.kind === "delay") {
    return createDelayCommand(args.args);
  }

  if (args.kind === "noresponse") {
    return createNoResponseCommand(args.args);
  }

  throw new Error(`Unknown command kind '${args.kind}'`);
}

function createDelayCommand(args) {
  return createDelay(args.interval);
}

function createNoResponseCommand(args) {
  return createNoResponseTransform();
}

function removeExpiredCommands() {
  const newCommands = activeCommands.filter(command => {
    return (command.deadline.getTime() - new Date().getTime()) > 0
  });

  if (newCommands.length < activeCommands.length) {
    console.log(`Expired ${activeCommands.length - newCommands.length} commands`);
  }

  activeCommands = newCommands;
}
