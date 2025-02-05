import path from 'path';
import fs from 'fs';
import { createBareServer } from '@nebula-services/bare-server-node';
import express from 'express';
import http from 'http';

const bareServer = createBareServer('/bare/');
const app = express();
const PORT = process.env.PORT || 80;

// Directory containing your static files
const publicDir = path.join(process.cwd(), 'public');

/* 
  1) DEFINE SPECIAL ROUTES OR REDIRECTS FIRST
     This ensures they take priority over static file serving.
*/

// Homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// /index.html -> /
app.get('/index.html', (req, res) => {
  return res.redirect(301, '/');
});

// /apps -> serve apps.html
app.get('/apps', (req, res) => {
  res.sendFile(path.join(publicDir, 'apps.html'));
});

// /apps.html -> /apps
app.get('/apps.html', (req, res) => {
  return res.redirect(301, '/apps');
});

/*
  You mentioned you have a file named gxmes.html, but you want users to go to /games.
  The code below:

  - Serves gxmes.html when a user goes to /games
  - Redirects /games.html -> /games
  - Redirects /gxmes or /gxmes.html -> /games

  This ensures any attempt to load gxmes.html directly (or an older link) ends up on /games.
*/
app.get('/games', (req, res) => {
  // Serve the actual gxmes.html file as the /games endpoint
  res.sendFile(path.join(publicDir, 'gxmes.html'));
});

app.get('/games.html', (req, res) => {
  // Redirect to /games, which uses gxmes.html
  return res.redirect(301, '/games');
});

app.get('/gxmes', (req, res) => {
  return res.redirect(301, '/games');
});

app.get('/gxmes.html', (req, res) => {
  return res.redirect(301, '/games');
});

// /privacy.html -> serve privacy.html
app.get('/privacy.html', (req, res) => {
  const privacyFile = path.join(publicDir, 'privacy.html');
  if (fs.existsSync(privacyFile)) {
    return res.sendFile(privacyFile);
  }
  // If privacy.html doesn't exist, show 404
  return res.status(404).sendFile(path.join(publicDir, '404.html'));
});

/*
  2) SERVE STATIC FILES
     Now that all special routes are handled, anything that doesn't match above
     can be served from the public/ directory automatically.
*/
app.use(express.static(publicDir));

/*
  3) CATCH-ALL 404 HANDLER
     If no static file or route matched, return a custom 404 page (if it exists).
*/
app.use((req, res) => {
  const notFound = path.join(publicDir, '404.html');
  if (fs.existsSync(notFound)) {
    return res.status(404).sendFile(notFound);
  }
  return res.status(404).send('404 Not Found');
});

/*
  4) CREATE SERVER & INTEGRATE BARE SERVER
     If you do NOT use the Bare server features, 
     simply do: const server = http.createServer(app).
*/
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

/*
  5) START LISTENING
*/
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Bare server available at http://localhost:${PORT}/bare/`);
});
