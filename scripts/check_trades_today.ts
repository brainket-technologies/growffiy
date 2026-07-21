import { prisma } from '../src/database/db';

async function main() {
  const trades = await prisma.trade.findMany({
    where: {
      symbol: 'AXISBANK',
      createdAt: {
        gte: new Date(new Date().setHours(0,0,0,0)),
      }
    },
    include: {
      client: { include: { user: true } },
    }
  });

  console.log('Today Axisbank Trades:', JSON.stringify(trades, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
