import http from 'http';

const hostname = '127.0.0.1';
const port = Number(process.argv[2]) || 3000;
const id = process.argv[3];



const server = http.createServer((req, res) => {
  console.log('received request');
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end(`Hello World from server '${id}'\n`);
});

server.listen(port, hostname, () => {
  console.log(`Server ${id}  running at http://${hostname}:${port}/`);
});
