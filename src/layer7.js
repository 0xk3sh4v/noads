'use strict';

const net = require('net');

// Layer 7 - plain HTTP

function parseHostFromHttp(httpStr) {
  const lines = httpStr.split('\r\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^host:/i.test(line)) {
      const idx = line.indexOf(':');
      const hostPort = line.slice(idx + 1).trim();

      if (!hostPort) return null;

      if (hostPort.indexOf(':') > -1) {
        const parts = hostPort.split(':');
        return { hostname: parts[0], port: parseInt(parts[1]) || 80 };
      }

      return { hostname: hostPort, port: 80 };
    }
  }

  return null;
}

function handleHttp(clientSocket, initialBuf) {
  const reqStr = initialBuf.toString();

  console.log('[LAYER 7] incoming HTTP request (capturing request line & headers)');
  const firstLine = reqStr.split('\r\n')[0] || '';
  console.log('[LAYER 7] ' + firstLine);

  const hostInfo = parseHostFromHttp(reqStr);
  if (!hostInfo) {
    console.error('[LAYER 7] could not find Host header, dropping connection.');
    try {
      clientSocket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    } catch (e) {
      /* no response */
    }
    return;
  }

  const hostname = hostInfo.hostname;
  const targetPort = hostInfo.port;
  console.log('[LAYER 7] forwarding to ' + hostname + ':' + targetPort);

  const targetSocket = net.createConnection({ host: hostname, port: targetPort }, function () {
    targetSocket.write(initialBuf);
    clientSocket.pipe(targetSocket);
    targetSocket.pipe(clientSocket);
  });

  targetSocket.on('error', function (err) {
    console.error('[LAYER 7] error connecting to ' + hostname + ':' + targetPort + ' -> ' + err.message);
    try {
      clientSocket.end('HTTP/1.1 502 Bad Gateway\r\n\r\n');
    } catch (e) {
      /* ignore */
    }
  });

  clientSocket.on('error', function (err) {
    console.error('[LAYER 7] client socket error: ' + (err && err.message));
    try {
      targetSocket.end();
    } catch (e) {
      /* ignore */
    }
  });
}

module.exports = {
  handleHttp,
  parseHostFromHttp,
};