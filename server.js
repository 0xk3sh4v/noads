const net = require('net');
const port = 8000;

const server = net.createServer((clientSocket) => {
    clientSocket.once('data', (data) => {
    const isConnect = data.toString().indexOf('CONNECT') === 0;

    if (isConnect) {
      const parts = data.toString().split(' ');
      const [hostname, port] = parts[1].split(':');

      console.log(`Establishing HTTPS tunnel to: ${hostname}:${port}`);

      const targetSocket = net.createConnection({

        host: hostname,
        port: parseInt(port) || 443
      
    }, function() {
        
        clientSocket.write('connection made');
        clientSocket.pipe(targetSocket);
        targetSocket.pipe(clientSocket);
      
    });

    } else {
      console.log('Non-HTTPS, Closing connection.');
      clientSocket.end('not allowed');
    }
  });

  clientSocket.on('error', (err) => {
    console.error('Client socket error:', err);
  });
});
server.listen(port, '0.0.0.0', () => {
  console.log(`proxy live on ${PROXY_PORT}`);
});