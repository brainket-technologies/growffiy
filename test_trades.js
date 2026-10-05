const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const trades = await prisma.trade.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, createdAt: true, pnl: true }
  });
  console.log(trades);
}
main().catch(console.error).finally(() => prisma.$disconnect());
