import path from 'path';
import fs from 'fs';
import http from 'http';
import https from 'https';
import express from 'express';
import { createBareServer } from '@tomphttp/bare-server-node';

const app = express();
const PORT = process.env.PORT || 80;

app.set('trust proxy', true);

const server = createBareServer('/bare/', {
  forward_headers: true  // Forward headers including X-Forwarded-Proto
});

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

// Add Service Worker headers middleware
app.use('/static/uv', (req, res, next) => {
  res.setHeader('Service-Worker-Allowed', '/');
  next();
});

// Serve static files
app.use('/static', express.static(path.join(publicDir, 'static')));
app.use(express.static(publicDir));

// Add headers for UV routes
app.use('/static/net/', (req, res, next) => {
  res.setHeader('Service-Worker-Allowed', '/');
  next();
});

app.use((req, res) => {
  const notFound = path.join(publicDir, '404.html');
  if (fs.existsSync(notFound)) {
    return res.status(404).sendFile(notFound);
  }
  return res.status(404).send('404 Not Found');
});

const httpServer = http.createServer((req, res) => {
  // Handle bare server requests first
  if (server.shouldRoute(req)) {
    server.routeRequest(req, res);
    return;
  }

  // Handle UV proxy requests
  if (req.url.startsWith('/static/net/')) {
    server.routeRequest(req, res);
    return;
  }

  // Handle all other requests through express
  app(req, res);
});

httpServer.on('upgrade', (req, socket, head) => {
  if (server.shouldRoute(req) || req.url.startsWith('/static/net/')) {
    server.routeUpgrade(req, socket, head);
  } else {
    socket.end();
  }
});

// Only start server if not in test
if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Bare server available at http://localhost:${PORT}/bare/`);
  });
}

// Cleanup function for tests
const cleanup = () => {
  return new Promise((resolve) => {
    // Close bare server first
    server.close();
    // Then close http server
    httpServer.close(() => {
      resolve();
    });
  });
};

// Export for testing
export { app, httpServer, cleanup, PORT };
