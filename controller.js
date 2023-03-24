import * as readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import got from 'got';

class ProxyClient {
  constructor(id, proxy) {
    this.id = id;
    this.proxy = proxy;
  }

  async sendCommand(command) {
    const { data } = await got.post(`http://${this.proxy}/command`, {
      json: command
    }).json();

    return data;
  }
}

class Controller {
  constructor() {
    this.clients = {};
    this.aliases = {};
    this.nextClientId = 1;
    this.nextCommandId = 1;
  }

  addProxy(alias, proxyUrl) {
    const proxy = new ProxyClient(this.nextClientId++, proxyUrl);
    this.clients[alias] = proxy;
  }

  async handleCommand(command) {
    if (command.kind === 'connect') {
      return this.handleConnect(command);
    }

    command.id = this.nextCommandId++;
    const dest = command.destination;
    const proxy = this.clients[dest];
    if (!proxy) {
      throw new Error(`Unknown connection '${dest}'. Use the 'connect' command to add connections.`);
    }

    const result = await proxy.sendCommand(command);
    return result;
  }

  handleConnect(command) {
    this.addProxy(command.alias, command.proxy);
    return { ok: true };
  }
}

const commandFactories = {
  'delay': {
    description: 'Delays responses from the specified node by the given interval for a period of time.',
    usage: 'delay <node> <duration> <interval>',
    factory: (dest, duration, interval) => {
      if (!dest || !duration || !interval) {
        throw new Error(`Invalid args. USAGE: ${commandFactories.delay.usage}`);
      }
    
      return {
        kind: 'delay',
        destination: dest,
        duration,
        args: {
          interval
        }
      }
    }
  },

  'noresponse': {
    description: 'Blocks responses from the specified node for a period of time.',
    usage: 'noresponse <node> <duration>',
    factory: (node, duration) => {
      if (!node || !duration) {
        throw new Error(`Invalid args. USAGE: ${commandFactories.noresponse.usage}`);
      }
      
      return {
        kind: 'noresponse',
        destination: node,
        duration,
        args: {}
      }
    }
  },
  
  'connect': {
    description: 'Connects to a node and gives it an alias to refer to by in other commands.',
    usage: 'connect <alias> <nodeAddress>',
    factory: (alias, proxy) => {
      if (!proxy || !alias) {
        throw new Error(`Invalid args. USAGE: ${commandFactories.connect.usage}`);
      }
  
      return {
        kind: 'connect',
        proxy,
        alias
      }
    }
  },
}

function parseCommand(source, commandFactories) {
  const parts = source.split(/\s+/);
  const [name, ...args] = parts;
  const commandData = commandFactories[name];
  if (!commandData) {
    throw new Error(`Unknown command ${name}`);
  }

  return commandData.factory(...args);
}

function printCommandList() {
  for (let command in commandFactories) {
    const { description, usage } = commandFactories[command];
    console.log(command);
    console.log(description);
    console.log(`Usage: ${usage}`);
    console.log();
  }

  console.log('exit');
  console.log('Exits this application.');
  console.log();
}

async function runCliApp() {
  const controller = new Controller();
  const rl = readline.createInterface({ input: stdin, output: stdout });

  while (true) {
    const input = await rl.question("> ");
    if (input === 'exit') {
      console.log('exiting...');
      return;
    }

    if (input === 'help') {
      printCommandList();
      continue;
    }

    try {
      const command = parseCommand(input, commandFactories);
      await controller.handleCommand(command);
      console.log('ok');
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
  }
}

await runCliApp().then(() => process.exit(0)).catch(() => process.exit(1));
