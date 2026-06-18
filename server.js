const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV === 'development';

// Permanent deployment solution: Automatically run prisma generate & next build on server startup
// if .next is missing, or if a Git auto-pull was detected (.git/index is newer than .next folder).
if (!dev) {
  try {
    const nextDir = path.join(__dirname, '.next');
    const gitIndex = path.join(__dirname, '.git', 'index');
    const prismaClientDir = path.join(__dirname, 'node_modules', '.prisma', 'client');
    
    let shouldBuild = !fs.existsSync(nextDir) || !fs.existsSync(prismaClientDir);
    
    if (!shouldBuild && fs.existsSync(gitIndex)) {
      const nextMtime = fs.statSync(nextDir).mtimeMs;
      const gitMtime = fs.statSync(gitIndex).mtimeMs;
      if (gitMtime > nextMtime) {
        console.log('AlgoEngine Deployer: Detected fresh Git pull. Rebuilding Next.js application...');
        shouldBuild = true;
      }
    }
    
    if (shouldBuild) {
      console.log('--- STARTING REMOTE PRISMA GENERATION & NEXT.JS BUILD ---');
      execSync('npx prisma generate', { stdio: 'inherit' });
      execSync('npx next build', { stdio: 'inherit' });
      console.log('--- REMOTE NEXT.JS BUILD COMPLETED SUCCESSFULLY ---');
      
      // Update .next folder modification time to prevent infinite rebuild loop
      const now = new Date();
      fs.utimesSync(nextDir, now, now);
    }
  } catch (buildErr) {
    console.error('AlgoEngine Deployer Error during auto-build:', buildErr);
  }
}

// Hostinger or other host might pass the port or default to 3000.
// In Hostinger, process.env.PORT is often a socket path string (e.g. /passenger.xxxx) instead of a number.
const port = process.env.PORT || 3000;
const isNumeric = !isNaN(port) && !isNaN(parseFloat(port));
const parsedPort = isNumeric ? parseInt(port, 10) : port;

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  })
  .once('error', (err) => {
    console.error(err);
    process.exit(1);
  })
  .listen(parsedPort, () => {
    console.log(`> Ready on ${isNumeric ? `http://localhost:${parsedPort}` : `socket/pipe ${parsedPort}`}`);
  });
}).catch((err) => {
  console.error('Failed to start next server:', err);
  process.exit(1);
});

