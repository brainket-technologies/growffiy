// Script: Delete duplicate trades from today 10:45-10:47 IST
// Usage: node scripts/delete-duplicate-trades.mjs

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 10:45 AM IST = 05:15 UTC, 10:47 AM IST = 05:17 UTC
  // Today date: 2026-07-13
  const todayStart = new Date('2026-07-13T05:15:00.000Z'); // 10:45 IST
  const todayEnd   = new Date('2026-07-13T05:17:00.000Z'); // 10:47 IST

  console.log(`\n🔍 Finding trades between 10:45-10:47 IST today...\n`);

  // Fetch all trades in this time window
  const trades = await prisma.trade.findMany({
    where: {
      createdAt: { gte: todayStart, lte: todayEnd }
    },
    include: {
      client: { include: { user: true } },
      strategy: true
    },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`Found ${trades.length} total trades in window.\n`);

  // Group by clientId + strategyId + legName (same combination = potential duplicates)
  const groups = new Map();
  for (const trade of trades) {
    const key = `${trade.clientId}__${trade.strategyId}__${trade.legName || 'null'}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(trade);
  }

  const toDelete = [];

  for (const [key, group] of groups) {
    if (group.length <= 1) continue; // No duplicates

    // Keep the FIRST one (oldest), delete the rest
    const [keep, ...duplicates] = group;
    const clientName = keep.client?.user?.name || keep.clientId;
    const strategyName = keep.strategy?.name || keep.strategyId;
    const legName = keep.legName || 'N/A';

    console.log(`\n📌 Group: ${clientName} | ${strategyName} | Leg: ${legName}`);
    console.log(`   ✅ KEEP  → ID: ${keep.id} | ${keep.createdAt.toISOString()} | Symbol: ${keep.symbol} | Status: ${keep.status}`);
    
    for (const dup of duplicates) {
      console.log(`   ❌ DELETE → ID: ${dup.id} | ${dup.createdAt.toISOString()} | Symbol: ${dup.symbol} | Status: ${dup.status}`);
      toDelete.push(dup.id);
    }
  }

  if (toDelete.length === 0) {
    console.log('\n✅ No duplicate trades found. Nothing to delete.');
    return;
  }

  console.log(`\n\n🗑️  Deleting ${toDelete.length} duplicate trade(s)...`);
  
  const result = await prisma.trade.deleteMany({
    where: { id: { in: toDelete } }
  });

  console.log(`✅ Successfully deleted ${result.count} duplicate trade(s)!`);
  console.log('\nDone. Refresh the admin panel to see updated data.\n');
}

main()
  .catch(e => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
