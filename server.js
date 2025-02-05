import path from 'path';
import fs from 'fs';
import { createBareServer } from '@nebula-services/bare-server-node';
import express from 'express';
import http from 'http';

const bareServer = createBareServer('/bare/');
const app = express();
const PORT = process.env.PORT || 80;

const publicDir = path.join(process.cwd(), 'public');

app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/index.html', (req, res) => {
  return res.redirect(301, '/');
});

app.get('/apps', (req, res) => {
  res.sendFile(path.join(publicDir, 'apps.html'));
});

app.get('/apps.html', (req, res) => {
  return res.redirect(301, '/apps');
});

app.get('/games', (req, res) => {
  res.sendFile(path.join(publicDir, 'gxmes.html'));
});

app.get('/games.html', (req, res) => {
  return res.redirect(301, '/games');
});

app.get('/gxmes', (req, res) => {
  return res.redirect(301, '/games');
});

app.get('/gxmes.html', (req, res) => {
  return res.redirect(301, '/games');
});

app.get('/privacy.html', (req, res) => {
  const privacyFile = path.join(publicDir, 'privacy.html');
  if (fs.existsSync(privacyFile)) {
    return res.sendFile(privacyFile);
  }
  return res.status(404).sendFile(path.join(publicDir, '404.html'));
});

app.use(express.static(publicDir));

app.use((req, res) => {
  const notFound = path.join(publicDir, '404.html');
  if (fs.existsSync(notFound)) {
    return res.status(404).sendFile(notFound);
  }
  return res.status(404).send('404 Not Found');
});

const server = http.createServer((req, res) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeRequest(req, res);
  } else {
    app(req, res);
  }
});

server.on('upgrade', (req, socket, head) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeUpgrade(req, socket, head);
  } else {
    socket.end();
  }
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Bare server available at http://localhost:${PORT}/bare/`);
});
