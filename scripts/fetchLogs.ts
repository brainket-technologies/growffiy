import { prisma } from '../src/database/db';

async function main() {
  console.log('Fetching latest Audit Logs...');
  
  const logs = await prisma.auditLog.findMany({
    where: {
      action: 'AUTO TRADE EXIT FAILED'
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 10
  });
  
  const strategyLogs = await prisma.strategyLog.findMany({
    where: {
      logType: 'error'
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 10
  });

  console.log('Audit Logs:', logs.map(l => l.newValue));
  console.log('Strategy Logs:', strategyLogs.map(l => l.message));
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
