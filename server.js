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
let isBuilding = false;
let buildError = null;

function runBuildCheck() {
  const nextDir = path.join(__dirname, '.next');
  const hasExistingBuild = fs.existsSync(nextDir);
  
  // Serve existing build immediately (no 503 if .next exists)
  if (hasExistingBuild) {
    prepareNextApp();
  }
  
  if (dev) return;
  
  if (process.env.DISABLE_AUTO_BUILD === 'true') {
    console.log('AlgoEngine Deployer: Auto-build is disabled via DISABLE_AUTO_BUILD env variable.');
    return;
  }
  
  // Check if rebuild needed
  const prismaClientDir = path.join(__dirname, 'node_modules', '.prisma', 'client');
  
  let shouldBuild = !hasExistingBuild || !fs.existsSync(prismaClientDir);
  
  if (shouldBuild) {
    // Only block requests if there's ZERO existing build (first deploy)
    isBuilding = !hasExistingBuild;
    console.log('--- STARTING REMOTE PRISMA GENERATION & NEXT.JS BUILD ---');
    const buildProcess = exec('npx prisma generate && npx next build', (err, stdout, stderr) => {
      isBuilding = false;
      if (err) {
        console.error('AlgoEngine Deployer Error during auto-build:', err);
        buildError = err;
      } else {
        console.log('--- REMOTE NEXT.JS BUILD COMPLETED SUCCESSFULLY ---');
        try {
          const now = new Date();
          fs.utimesSync(nextDir, now, now);
        } catch (e) {}
        if (!hasExistingBuild) {
          prepareNextApp();
        }
      }
    });
    // Timeout: kill build if it takes > 5 minutes
    const buildTimeout = setTimeout(() => {
      console.error('AlgoEngine Deployer: Build timed out after 5 minutes. Killing process.');
      buildProcess.kill();
      isBuilding = false;
      buildError = new Error('Build timed out after 5 minutes');
    }, 300000);
    buildProcess.on('exit', () => clearTimeout(buildTimeout));
  } else if (!hasExistingBuild) {
    prepareNextApp();
  }
}

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
  if (isBuilding) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'text/html');
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Updating Application...</title>
        <meta http-equiv="refresh" content="5">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; padding: 80px 20px; background: #f8fafc; color: #1e293b; }
          .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); display: inline-block; max-width: 450px; border: 1px solid #e2e8f0; }
          .spinner { border: 3px solid #f1f5f9; width: 40px; height: 40px; border-radius: 50%; border-left-color: #3b82f6; animation: spin 1s linear infinite; display: inline-block; margin-bottom: 24px; }
          h2 { margin: 0 0 10px 0; font-size: 20px; font-weight: 600; }
          p { margin: 0; color: #64748b; font-size: 14px; line-height: 1.5; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="spinner"></div>
          <h2>Updating Platform</h2>
          <p>We are compiling the latest updates and preparing the trading engine. This will take about 15-30 seconds.</p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 15px;">Page will auto-refresh automatically.</p>
        </div>
      </body>
      </html>
    `);
    return;
  }
  
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
  // Run the build check asynchronously after server listens to prevent Passenger startup timeout
  runBuildCheck();
});
