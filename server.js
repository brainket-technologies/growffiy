const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV === 'development';
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
