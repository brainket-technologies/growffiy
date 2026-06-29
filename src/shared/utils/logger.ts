import fs from 'fs';
import path from 'path';
import util from 'util';

let initialized = false;

export function initGlobalLogger() {
  if (initialized) return;
  
  // Ensure logs directory exists
  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logFile = path.join(logDir, 'runtime.log');
  
  // Create a writable stream in append mode
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });

  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;

  const formatMessage = (level: string, args: any[]) => {
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const message = util.format.apply(null, args);
    return `[${timestamp}] [${level}] ${message}\n`;
  };

  console.log = function (...args) {
    originalConsoleLog.apply(console, args);
    logStream.write(formatMessage('INFO', args));
  };

  console.warn = function (...args) {
    originalConsoleWarn.apply(console, args);
    logStream.write(formatMessage('WARN', args));
  };

  console.error = function (...args) {
    originalConsoleError.apply(console, args);
    logStream.write(formatMessage('ERROR', args));
  };

  initialized = true;
  console.log('Global runtime logger initialized.');
}
