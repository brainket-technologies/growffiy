import { prisma } from '../src/database/db';

async function main() {
  console.log('Updating today\'s trade badge...');
  const tradeId = '997a08f8-123b-4ca9-9d88-5e954d1ed054';

  const updatedTrade = await prisma.trade.update({
    where: { id: tradeId },
    data: {
      entryOrderStatus: 'CANCELLED'
    }
  });

  console.log('Successfully updated today\'s trade:', JSON.stringify(updatedTrade, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
