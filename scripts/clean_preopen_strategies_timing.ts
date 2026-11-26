import { prisma } from '../src/database/db';

const TARGET_STRATEGIES = [
  { id: '68dbbeb8-9162-40ad-91f2-f5053767e69b', name: 'Bear 5M 2X ' },
  { id: '866c5f13-0357-4b7d-8bd4-26d2a09c2105', name: 'Bull 5M 2X ' },
  { id: '717106c3-4a04-4e19-b066-ea831332a691', name: 'OHP 15 M ' },
];

async function run() {
  console.log('--- SURGICAL DATABASE TIMING CLEANUP ---');

  for (const item of TARGET_STRATEGIES) {
    const strat = await prisma.strategy.findUnique({ where: { id: item.id } });
    if (!strat || !strat.configJson) {
      console.warn(`Strategy not found: ${item.name} (${item.id})`);
      continue;
    }

    const config = JSON.parse(strat.configJson);

    console.log(`\n========================================`);
    console.log(`STRATEGY: ${strat.name} (${strat.id})`);
    console.log(`BEFORE basicInfo:`, {
      preSelectTime: config.basicInfo?.preSelectTime,
      snapshotTimeSlot: config.basicInfo?.snapshotTimeSlot,
      exitTime: config.basicInfo?.exitTime,
      engineType: config.basicInfo?.engineType,
    });

    // SURGICAL UPDATE: ONLY modify preSelectTime and snapshotTimeSlot
    if (config.basicInfo) {
      config.basicInfo.preSelectTime = '09:13:30';
      delete config.basicInfo.snapshotTimeSlot;
    }

    console.log(`AFTER basicInfo:`, {
      preSelectTime: config.basicInfo?.preSelectTime,
      snapshotTimeSlot: config.basicInfo?.snapshotTimeSlot,
      exitTime: config.basicInfo?.exitTime,
      engineType: config.basicInfo?.engineType,
    });

    const updatedConfigJson = JSON.stringify(config);

    await prisma.strategy.update({
      where: { id: item.id },
      data: { configJson: updatedConfigJson }
    });

    console.log(`✓ Successfully updated ${item.name}`);
  }

  console.log('\n--- VERIFYING FINAL DB STATE ---');
  for (const item of TARGET_STRATEGIES) {
    const s = await prisma.strategy.findUnique({ where: { id: item.id } });
    const cfg = JSON.parse(s?.configJson || '{}');
    console.log(`Verified ${s?.name}:`, {
      preSelectTime: cfg.basicInfo?.preSelectTime,
      snapshotTimeSlot: cfg.basicInfo?.snapshotTimeSlot,
      exitTime: cfg.basicInfo?.exitTime,
      stoploss: cfg.stoploss?.fixedPercent,
      target: cfg.target?.profitPercent,
      numberOfStocks: cfg.basicInfo?.numberOfStocks,
      legsCount: cfg.legs?.length
    });
  }
}

run()
  .catch((err) => {
    console.error('Error during cleanup:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
