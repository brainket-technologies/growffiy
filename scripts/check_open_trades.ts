import { prisma } from '../src/database/db';

async function main() {
  const openTrades = await prisma.trade.findMany({
    where: {
      status: {
        in: ['open', 'placed', 'active', 'submitted', 'TRIGGER PENDING']
      }
    },
    take: 5
  });
  console.log('Open trades:', JSON.stringify(openTrades, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
