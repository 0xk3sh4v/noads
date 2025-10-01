'use strict';

const net = require('net');
const fs = require('fs');
const path = require('path');

const sourcesDir = path.join(__dirname, '../blocksource');

function loadBlocklist() {
  let domains = new Set();
  const files = fs.readdirSync(sourcesDir);

  for (const file of files) {
    const fullPath = path.join(sourcesDir, file);
    if (fs.statSync(fullPath).isFile()) {
      const lines = fs.readFileSync(fullPath, 'utf8')
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('#')); // comments in blocklist files are given by #, for further reference.
      lines.forEach(d => domains.add(d.toLowerCase()));
    }
  }
  return domains;
}

const blocklist = loadBlocklist();

// Layer 4 - TCP tunnel
function handleTunnel(clientSocket, reqStr) {
  
  const parts = reqStr.split(' ');
  const target = (parts[1] || '').split(':');
  const hostname = (target[0] || '').toLowerCase();
  const targetPort = parseInt(target[1]) || 443;

  console.log('[LAYER 4] ' + hostname + ':' + targetPort);

  if (blocklist.has(hostname)) {
    console.log('[DROPPED] ' + hostname);

    // clientSocket.write('HTTP/1.1 403 Forbidden\r\n\r\n'); // might break some clients
    
    clientSocket.write('HTTP/1.1 404 Not Found\r\n\r\n');
    clientSocket.end();
    return;
  }

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
