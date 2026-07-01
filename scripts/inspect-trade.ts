import { prisma } from '../src/database/db';

async function main() {
  const trade = await prisma.trade.findFirst({
    where: {
      entryOrderId: '260701170105404'
    },
    include: {
      client: { include: { user: true } },
      strategy: true
    }
  });

  console.log('Today Trade Record:', JSON.stringify(trade, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
