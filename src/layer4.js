'use strict';

const net = require('net');

// Layer 4 - TCP tunnel

function handleTunnel(clientSocket, reqStr) {
  
  const parts = reqStr.split(' ');
  const target = (parts[1] || '').split(':');
  const hostname = target[0];
  const targetPort = parseInt(target[1]) || 443;

  console.log('[LAYER 4] ' + hostname + ':' + targetPort);

  const targetSocket = net.createConnection({ host: hostname, port: targetPort }, function () {

    clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
    clientSocket.pipe(targetSocket);
    targetSocket.pipe(clientSocket);
  });

  targetSocket.on('error', function (err) {

    console.error('[LAYER 4] ' + hostname + ':' + targetPort + ' threw: ' + err.message);
    
    try { clientSocket.end(); } 
    catch (e) { /* no task to be done*/ }

  });

  clientSocket.on('error', function (err) {

    console.error('[LAYER 4] client socket error: ' + (err && err.message) );
    try { targetSocket.end(); } catch (e) { /*ignoring this*/ }
  
  });

  clientSocket.setTimeout(30000, () => {
  
    console.error('[LAYER 4] client socket timeout, dropping.');
    clientSocket.end();
    targetSocket.end();
  
  });
}

module.exports = {
  handleTunnel,
};
