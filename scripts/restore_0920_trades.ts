import { prisma } from '../src/database/db';

async function main() {
  const strat = await prisma.strategy.findFirst({ where: { name: 'Pre-Open Momentum Breakout' } });
  if (!strat) { console.log('Strategy not found'); return; }

  const clients = await prisma.client.findMany({
    where: { strategyId: strat.id, tradingStatus: 'active' },
    include: { user: { select: { name: true } } }
  });

  // 09:20 IST = 03:50 UTC
  const entryTime = new Date('2026-07-13T03:50:00.000Z');

  for (const client of clients) {
    const existing = await prisma.trade.findFirst({
      where: {
        clientId: client.id,
        symbol: 'BAJAJHLDNG',
        createdAt: { gte: new Date('2026-07-13T00:00:00.000Z') },
        legName: null
      }
    });

    if (existing) {
      console.log(`Trade already exists for ${client.user.name}, skipping`);
      continue;
    }

    const trade = await prisma.trade.create({
      data: {
        clientId: client.id,
        strategyId: strat.id,
        symbol: 'BAJAJHLDNG',
        orderType: 'MIS',
        entryPrice: 10150,
        quantity: 0,
        status: 'FAILED',
        entryTime,
        createdAt: entryTime,
        kiteResponse: { message: 'Skipped: Calculated quantity is 0' }
      }
    });

    console.log(`Created trade for ${client.user.name}: ${trade.id.slice(0,8)}`);
  }

  console.log('\nDone. Verifying...');
  const trades = await prisma.trade.findMany({
    where: {
      strategyId: strat.id,
      createdAt: { gte: new Date('2026-07-13T00:00:00.000Z') }
    },
    orderBy: { createdAt: 'asc' },
    include: { client: { include: { user: { select: { name: true } } } } }
  });
  for (const t of trades) {
    const time = t.createdAt instanceof Date ? t.createdAt.toISOString().slice(11, 16) : String(t.createdAt).slice(11, 16);
    console.log(`${time} ${t.client.user.name} ${t.symbol} ${t.status} qty=${t.quantity} price=${t.entryPrice}`);
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
