import { prisma } from './database/db';

async function main() {
  const totalClients = await prisma.client.count();
  const activeClients = await prisma.client.count({ where: { tradingStatus: 'active' } });
  const trades = await prisma.trade.findMany();
  console.log({ totalClients, activeClients, totalTrades: trades.length });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
