import { prisma } from '../src/database/db';

export const KULDEEP_CLIENT_ID = 'a6ad5d1d-1da9-40b9-b14d-72bc4f60e65c';

async function rollback() {
  console.log('Rolling back 11 demo winning trades for Kuldeep...');
  
  const result = await prisma.trade.deleteMany({
    where: {
      id: {
        startsWith: 'c001dea0-',
      },
      clientId: KULDEEP_CLIENT_ID,
    },
  });

  console.log(`Successfully deleted ${result.count} demo trades.`);

  const allTrades = await prisma.trade.findMany({
    where: { clientId: KULDEEP_CLIENT_ID },
  });
  
  const nonZero = allTrades.filter(t => Number(t.pnl || 0) !== 0);
  const wins = nonZero.filter(t => Number(t.pnl || 0) > 0);
  const losses = nonZero.filter(t => Number(t.pnl || 0) < 0);
  const sumWins = wins.reduce((s, t) => s + Number(t.pnl || 0), 0);
  const sumLosses = losses.reduce((s, t) => s + Math.abs(Number(t.pnl || 0)), 0);
  const netPnl = sumWins - sumLosses;

  console.log('\n--- AFTER ROLLBACK DB STATS ---');
  console.log('Remaining trades:', nonZero.length);
  console.log('Wins:', wins.length, 'Sum: ₹' + sumWins.toFixed(2));
  console.log('Losses:', losses.length, 'Sum: ₹' + sumLosses.toFixed(2));
  console.log('Reverted Net P&L: ₹' + netPnl.toFixed(2));
}

rollback()
  .catch((e) => {
    console.error('Error rolling back trades:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
