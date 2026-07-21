import { prisma } from '../src/database/db';

async function main() {
  const tradeId = 'e0333d78-35f8-42c6-a336-9a9b52d8892d';
  
  // Reset the rejected trade back to open status using manual order details
  const updatedTrade = await prisma.trade.update({
    where: { id: tradeId },
    data: {
      status: 'open',
      targetOrderId: '260720170174602',
      targetOrderStatus: 'OPEN',
      slOrderStatus: 'TRIGGER PENDING',
      exitReason: null,
      exitTime: null,
      exitPrice: null,
      pnl: null
    }
  });

  console.log('Successfully updated trade to OPEN status using manual entry details:', JSON.stringify(updatedTrade, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
