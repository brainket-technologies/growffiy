import { prisma } from '../src/database/db';

async function run() {
  const strategy = await prisma.strategy.findFirst({ where: { name: 'Ten AM Strategy' } });
  if (!strategy) return;
  const deleted = await prisma.trade.deleteMany({
    where: { strategyId: strategy.id }
  });
  console.log(`Deleted ${deleted.count} trades for Ten AM strategy to allow re-testing`);
}
run().catch(console.error).finally(() => process.exit(0));
