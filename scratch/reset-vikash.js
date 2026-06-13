const { PrismaClient } = require('@prisma/client');
const { PrismaNeon } = require('@prisma/adapter-neon');
const ws = require('ws');
require('dotenv').config();

global.WebSocket = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const result = await prisma.client.updateMany({
    data: {
      subscriptionStatus: 'pending'
    }
  });

  console.log('Reset subscription status for clients in DB to pending. Count:', result.count);
}

main()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
