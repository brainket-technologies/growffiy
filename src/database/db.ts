import dotenv from 'dotenv';
import path from 'path';
import ws from 'ws';

// Force load .env from absolute root paths
import fs from 'fs';
const rootEnv = path.resolve(process.cwd(), '.env');
const nestedEnv = path.join(__dirname, '../../../../.env');
if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
} else if (fs.existsSync(nestedEnv)) {
  dotenv.config({ path: nestedEnv });
} else {
  // Try up to root levels in project structure
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
  dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
  dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
  dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });
}

// Setup global WebSocket polyfill for Neon serverless adapter in Node.js environment
if (!global.WebSocket) {
  global.WebSocket = ws as any;
}

import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let activePrisma: PrismaClient | null = null;

function getPrisma(): PrismaClient {
  if (activePrisma) return activePrisma;
  
  if (globalForPrisma.prisma) {
    activePrisma = globalForPrisma.prisma;
    return activePrisma;
  }

  const connString = process.env.DATABASE_URL;
  if (!connString) {
    console.warn("db.ts: DATABASE_URL is not defined in the environment. Initializing standard PrismaClient placeholder.");
    activePrisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query'] : [],
    });
    return activePrisma;
  }

  try {
    const adapter = new PrismaNeon({ connectionString: connString });
    activePrisma = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query'] : [],
    });
  } catch (err) {
    console.error("db.ts: Failed to initialize Prisma with Neon adapter, falling back to standard PrismaClient:", err);
    activePrisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query'] : [],
    });
  }

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = activePrisma;
  }
  return activePrisma;
}

// Export a Proxy that intercepts all database queries and initializes Prisma lazily on demand
export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    const realPrisma = getPrisma();
    const value = Reflect.get(realPrisma, prop);
    if (typeof value === 'function') {
      return value.bind(realPrisma);
    }
    return value;
  }
});

