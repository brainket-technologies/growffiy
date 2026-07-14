import { prisma } from '../src/database/db';

async function main() {
  console.log('=== Strategy Logs (today) ===');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const logs = await prisma.strategyLog.findMany({
    where: { createdAt: { gte: today } },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { id: true, createdAt: true, type: true, message: true }
  });
  for (const l of logs) {
    console.log(`${l.createdAt.toISOString().slice(11,16)} [${l.type}] ${l.message?.slice(0,150)}`);
  }

  console.log('\n=== Clients ===');
  const clients = await prisma.client.findMany({
    select: { id: true, name: true, status: true }
  });
  for (const c of clients) {
    console.log(`  ${c.id} ${c.name} ${c.status}`);
  }

  console.log('\n=== All Trades (today) ===');
  const trades = await prisma.trade.findMany({
    where: { createdAt: { gte: today } },
    orderBy: { createdAt: 'asc' },
    take: 50,
    select: { id: true, clientId: true, symbol: true, status: true, entryPrice: true, quantity: true, createdAt: true }
  });
  console.log(`Count: ${trades.length}`);
  for (const t of trades) {
    const time = t.createdAt instanceof Date ? t.createdAt.toISOString().slice(11,16) : String(t.createdAt);
    console.log(`  ${time} cid=${t.clientId} ${t.symbol} ${t.status} qty=${t.quantity} entry=${t.entryPrice}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
