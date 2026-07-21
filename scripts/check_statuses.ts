import { prisma } from '../src/database/db';

async function main() {
  const pastActiveTrades = await prisma.trade.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' }
  });
  
  console.log('Trade Statuses:');
  pastActiveTrades.forEach(t => {
    console.log(`Symbol: ${t.symbol}, Status: ${t.status}, TargetStatus: ${t.targetOrderStatus}, SLStatus: ${t.slOrderStatus}, ExitReason: ${t.exitReason}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
