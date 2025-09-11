const net = require('net');
const port = 8000;

const server = net.createServer((clientSocket) => {
  clientSocket.once('data', (data) => {
    const req = data.toString();
    const isConnect = req.indexOf('CONNECT') === 0;

    if (isConnect) {
      const parts = req.split(' ');
      const [hostname, targetPort] = parts[1].split(':');

      console.log(`Establishing HTTPS tunnel to: ${hostname}:${targetPort}`);

      const targetSocket = net.createConnection(
        { host: hostname, port: parseInt(targetPort) || 443 },
        () => {
          clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');

          clientSocket.pipe(targetSocket);
          targetSocket.pipe(clientSocket);
        }
      );

      targetSocket.on('error', (err) => {
        console.error('Target socket error:', err);
        clientSocket.end();
      });
    } else {
      console.log('Non-HTTPS request (direct HTTP), closing.');
      clientSocket.end('HTTP/1.1 403 Forbidden\r\n\r\n');
    }
  });

  clientSocket.on('error', (err) => {
    console.error('Client socket error:', err);
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Proxy live on ${port}`);
});
