import { prisma } from '../src/database/db';
import { Prisma } from '@prisma/client';

async function main() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dateStr = new Date().toISOString().slice(0,10);

  // Get strategy ID for Pre-Open Momentum Breakout
  const strat = await prisma.strategy.findFirst({ where: { name: 'Pre-Open Momentum Breakout' } });
  if (!strat) { console.log('Strategy not found'); return; }
  console.log('Strategy ID:', strat.id);

  // Check logs around 09:20 (03:50 UTC)
  const logs = await prisma.strategyLog.findMany({
    where: { strategyId: strat.id, createdAt: { gte: new Date(Date.now() - 24*60*60*1000) } },
    orderBy: { createdAt: 'asc' },
    take: 50,
    select: { id: true, createdAt: true, logType: true, message: true }
  });
  
  console.log('\n=== All logs for this strategy (last 24h) ===');
  for (const l of logs) {
    const time = l.createdAt instanceof Date ? l.createdAt.toISOString() : String(l.createdAt);
    console.log(`${time} [${l.logType}] ${l.message?.slice(0,200)}`);
  }

  // Get clients that have this strategy
  console.log('\n=== Clients with this strategy ===');
  const clients = await prisma.client.findMany({
    where: { strategyId: strat.id },
    select: { 
      id: true, 
      capital: true,
      tradingStatus: true,
      user: { select: { name: true, email: true } },
      trades: { where: { createdAt: { gte: today } }, select: { symbol: true, status: true, createdAt: true }, take: 5 }
    }
  });
  for (const c of clients) {
    console.log(`  ID=${c.id.slice(0,8)} Name=${c.user.name} Capital=${c.capital} Status=${c.tradingStatus}`);
    for (const t of c.trades) {
      const time = t.createdAt instanceof Date ? t.createdAt.toISOString().slice(11,16) : String(t.createdAt);
      console.log(`    Trade: ${time} ${t.symbol} ${t.status}`);
    }
  }

  // Strategy conditions
  console.log('\n=== Strategy Conditions ===');
  const conditions = await prisma.strategyCondition.findMany({
    where: { strategyId: strat.id }
  });
  for (const c of conditions) {
    console.log(`  ${JSON.stringify(c)}`);
  }

  // Strategy assignments
  console.log('\n=== Preselections ===');
  const presels = await prisma.strategyPreselect.findMany({
    where: { strategyId: strat.id }
  });
  for (const p of presels) {
    console.log(`  ${JSON.stringify(p)}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
