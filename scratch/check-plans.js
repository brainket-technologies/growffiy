const { PrismaClient } = require('@prisma/client');
const { PrismaNeon } = require('@prisma/adapter-neon');
const ws = require('ws');
require('dotenv').config();

global.WebSocket = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const plans = await prisma.subscriptionPlan.findMany();
  console.log('Plans in DB:', JSON.stringify(plans, null, 2));
}

main()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
