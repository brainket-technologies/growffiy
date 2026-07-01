import { prisma } from '../src/database/db';

async function main() {
  console.log('Cleaning up yesterday stuck trade...');
  const tradeId = '805ed493-ed8e-4e0e-af8e-379b09848d34';

  const updatedTrade = await prisma.trade.update({
    where: { id: tradeId },
    data: {
      status: 'sl_hit',
      exitPrice: 2102.7,
      exitReason: 'SL Hit',
      pnl: -85.60,
      targetOrderStatus: 'CANCELLED'
    }
  });

  console.log('Successfully cleaned up trade:', JSON.stringify(updatedTrade, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
