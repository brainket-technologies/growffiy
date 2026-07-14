import { prisma } from '../src/database/db';

async function main() {
  const dateStr = new Date().toISOString().slice(0,10);

  console.log('=== OHLC 09:20 ===');
  const ohlc = await prisma.historicalOhlc.findMany({
    where: { date: dateStr, time: '09:20' },
    orderBy: { symbol: 'asc' }
  });
  console.log(`Count: ${ohlc.length}`);
  for (const o of ohlc) {
    console.log(`  ${o.symbol} O=${o.open} H=${o.high} L=${o.low} C=${o.close} V=${o.volume}`);
  }

  console.log('\n=== Strategy ===');
  const strat = await prisma.strategy.findFirst({ where: { name: 'Pre-Open Momentum Breakout' } });
  if (!strat) { console.log('Not found'); return; }
  console.log(`ID=${strat.id} Name=${strat.name}`);

  console.log('\n=== Clients with this strategy ===');
  const clients = await prisma.client.findMany({
    where: { strategyId: strat.id, tradingStatus: 'active' },
    select: { id: true, capital: true, user: { select: { name: true, email: true } } }
  });
  for (const c of clients) {
    console.log(`  ID=${c.id.slice(0,8)} Name=${c.user.name} Capital=${c.capital}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
