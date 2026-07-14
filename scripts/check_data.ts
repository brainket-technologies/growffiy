import { prisma } from '../src/database/db';

async function main() {
  const today = new Date(); today.setHours(0, 0, 0, 0);

  console.log('=== Strategy Logs (today) ===');
  const logs = await prisma.strategyLog.findMany({
    where: { createdAt: { gte: today } },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { id: true, createdAt: true, logType: true, strategyId: true, message: true }
  });
  for (const l of logs) {
    const time = l.createdAt instanceof Date ? l.createdAt.toISOString().slice(11,16) : String(l.createdAt);
    console.log(`${time} [${l.logType}] strat=${l.strategyId.slice(0,8)} ${l.message?.slice(0,200)}`);
  }

  console.log('\n=== Clients ===');
  const clients = await prisma.client.findMany({
    select: { id: true, name: true, status: true }
  });
  for (const c of clients) {
    console.log(`  ${c.id.slice(0,8)} ${c.name} ${c.status}`);
  }

  console.log('\n=== Strategy ===');
  const strat = await prisma.strategy.findFirst({ where: { name: 'Pre-Open Momentum Breakout' } });
  if (strat) console.log(`  id=${strat.id.slice(0,8)} name=${strat.name}`);
  else console.log('  NOT FOUND');

  console.log('\n=== HistoricalOHLC (today 09:20) ===');
  const dateStr = new Date().toISOString().slice(0,10);
  const ohlc = await prisma.historicalOhlc.findMany({
    where: { date: dateStr, time: '09:20' },
    orderBy: { symbol: 'asc' }
  });
  console.log(`Count: ${ohlc.length}`);
  for (const o of ohlc) {
    console.log(`  ${o.symbol} open=${o.open} high=${o.high} low=${o.low} close=${o.close}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
