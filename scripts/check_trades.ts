import { prisma } from '../src/database/db';
async function main() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const trades = await prisma.trade.findMany({
    where: { createdAt: { gte: today }, strategy: { name: 'Pre-Open Momentum Breakout' } },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { id: true, createdAt: true, symbol: true, status: true, quantity: true, entryPrice: true, exitPrice: true }
  });
  console.log(`Total trades today: ${trades.length}`);
  for (const t of trades) {
    const time = t.createdAt instanceof Date ? t.createdAt.toISOString().slice(11,16) : String(t.createdAt);
    console.log(`${time} ${t.symbol} ${t.status} qty=${t.quantity} entry=${t.entryPrice} exit=${t.exitPrice}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
