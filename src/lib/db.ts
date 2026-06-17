import dotenv from 'dotenv';
import path from 'path';
import ws from 'ws';

// Force load .env from multiple potential directory contexts
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Setup global WebSocket polyfill for Neon serverless adapter in Node.js environment
if (!global.WebSocket) {
  global.WebSocket = ws as any;
}

import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
