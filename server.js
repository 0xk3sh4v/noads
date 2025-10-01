'use strict';

const net = require('net');

const layer4 = require('./src/layer4');

const PORT = process.env.PORT || 8000;

const server = net.createServer((clientSocket) => {
  clientSocket.setTimeout(30000);
  clientSocket.on('timeout', function() {
    console.error('client socket timeout, ending connection.');
    clientSocket.end();
  });

  clientSocket.once('data', function(data) {
    const reqStr = data.toString();
    const isConnect = reqStr.indexOf('CONNECT') === 0;

    if (isConnect) {
      layer4.handleTunnel(clientSocket, reqStr);
    } else {
      // layer7.handleHttp(clientSocket, data);
      // for now, just ignore non transport layer traffic
    }
  });

  clientSocket.on('error', function(err) {
    console.error('Connection dropped from host, err=', (err && err.message));
  });
});

server.on('error', function(err) {
  console.error('Proxy server error:', err.message);
});

server.listen(PORT, '0.0.0.0', function() {
  console.log('Proxy live on ' + PORT);
});