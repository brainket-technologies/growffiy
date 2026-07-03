const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Auto-install dependencies if missing on the server
try {
  require.resolve('next');
  require.resolve('@prisma/client');
  require.resolve('ws');
} catch (e) {
  console.log('AlgoEngine Deployer: Missing dependencies. Running npm install on server...');
  try {
    execSync('npm install --production=false', { stdio: 'inherit' });
    console.log('AlgoEngine Deployer: npm install completed successfully!');
  } catch (installErr) {
    console.error('AlgoEngine Deployer: npm install failed:', installErr);
  }
}

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV === 'development';

let app = null;
let handle = null;
let buildError = null;

function prepareNextApp() {
  app = next({ dev });
  handle = app.getRequestHandler();
  app.prepare().then(() => {
    console.log('Next.js app prepared and ready to handle requests.');
  }).catch((err) => {
    console.error('Failed to prepare Next.js app:', err);
    buildError = err;
  });
}

// Hostinger or other host might pass the port or default to 3000.
// In Hostinger, process.env.PORT is often a socket path string (e.g. /passenger.xxxx) instead of a number.
const port = process.env.PORT || 3000;
const isNumeric = !isNaN(port) && !isNaN(parseFloat(port));
const parsedPort = isNumeric ? parseInt(port, 10) : port;

const server = createServer(async (req, res) => {
  if (buildError) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain');
    res.end(`Build Error:\n${buildError.message}\n\nPlease check server logs.`);
    return;
  }

  if (!handle) {
    res.statusCode = 503;
    res.end('Server is initializing. Please refresh in a few seconds.');
    return;
  }

  try {
    const parsedUrl = parse(req.url, true);
    await handle(req, res, parsedUrl);
  } catch (err) {
    console.error('Error occurred handling', req.url, err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
});

server.once('error', (err) => {
  console.error(err);
  process.exit(1);
});

server.listen(parsedPort, () => {
  console.log(`> Ready on ${isNumeric ? `http://localhost:${parsedPort}` : `socket/pipe ${parsedPort}`}`);
  prepareNextApp();
});
