import { prisma } from '../src/database/db';

async function main() {
  console.log('Resetting SL order status for PERSISTENT trade...');
  
  // Find the trade
  const trade = await prisma.trade.findFirst({
    where: {
      symbol: 'PERSISTENT',
      slOrderId: 'REJECTED'
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  if (!trade) {
    console.log('Could not find the PERSISTENT trade with REJECTED SL.');
    return;
  }

  console.log('Found trade:', trade.id);
  
  const updated = await prisma.trade.update({
    where: { id: trade.id },
    data: {
      slOrderId: null,
      slOrderStatus: null
    }
  });

  console.log('Successfully reset SL order fields!', updated.id);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
