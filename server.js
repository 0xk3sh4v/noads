const net = require('net');
const port = 8000;

// osi layer 4 (application communication, no API)

const server = net.createServer((clientSocket) => {
  clientSocket.once('data', (data) => {
    const req = data.toString();
    const isConnect = req.indexOf('CONNECT') === 0;

    if (isConnect) {
      const parts = req.split(' ');
      const [hostname, targetPort] = parts[1].split(':');

      console.log(`tunnel connection to: ${hostname}:${targetPort}`);

      // creating connection from the proxy device.
      const targetSocket = net.createConnection(
        { host: hostname, port: parseInt(targetPort) || 443 }, function () {

          clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
          clientSocket.pipe(targetSocket);
          targetSocket.pipe(clientSocket);

        }
      );

      // if the connection throws error, drop connection.
      targetSocket.on('error', function(err) {
        console.error(`connected socket ${hostname}:${port} threw an error, most likely CONRESET`);
        clientSocket.end();
      });

    } 
    
    else {
      console.log('Non https, not secure to connect, dropping connection.');
      clientSocket.end('HTTP/1.1 404 Not Found\r\n\r\n');
    }
  });

  clientSocket.on('error', (err) => {
    console.error('Connection dropped from host, you either removed closed the task or got kicked.');
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Proxy live on ${port}`);
});
