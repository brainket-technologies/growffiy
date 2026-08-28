import { prisma } from '../src/database/db';

async function main() {
  const result = await prisma.trade.deleteMany({
    where: {
      symbol: 'MFSL',
      quantity: 0
    }
  });
  console.log(`Deleted ${result.count} MFSL trade(s) with 0 quantity.`);
}

main().catch(console.error).finally(() => process.exit(0));
