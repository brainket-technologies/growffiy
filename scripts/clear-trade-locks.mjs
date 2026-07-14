// Script to clear all trade lock records from DB
// Run with: node scripts/clear-trade-locks.mjs

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const deleted = await prisma.appSettings.deleteMany({
      where: {
        type: 'lock',
        settingKey: { startsWith: 'trade_lock_' }
      }
    });
    console.log(`✅ Deleted ${deleted.count} trade lock(s) from database.`);
  } catch (err) {
    console.error('❌ Error clearing locks:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
