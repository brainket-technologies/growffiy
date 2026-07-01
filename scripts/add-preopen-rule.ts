import { prisma } from '../src/database/db';

async function main() {
  console.log('Fetching active strategies...');
  const strategies = await prisma.strategy.findMany({
    where: { status: 'active' }
  });

  console.log(`Found ${strategies.length} active strategies. Processing...`);

  for (const strategy of strategies) {
    if (!strategy.configJson) {
      console.log(`Skipping "${strategy.name}" - configJson is null`);
      continue;
    }

    try {
      const config = JSON.parse(strategy.configJson);
      
      // Ensure conditions array exists
      if (!config.conditions) {
        config.conditions = [];
      }

      // Check if Pre Open Change % condition already exists
      const hasCondition = config.conditions.some(
        (c: any) => c.indicator === 'Pre Open Change %'
      );

      if (hasCondition) {
        console.log(`Skipping "${strategy.name}" - Condition already exists`);
        continue;
      }

      // Add the new condition
      config.conditions.push({
        logical: 'AND',
        indicator: 'Pre Open Change %',
        operator: '>',
        value: '-10'
      });

      // Save back to DB
      await prisma.strategy.update({
        where: { id: strategy.id },
        data: {
          configJson: JSON.stringify(config)
        }
      });

      console.log(`Successfully added condition to strategy "${strategy.name}"`);
    } catch (e) {
      console.error(`Error processing strategy "${strategy.name}":`, e);
    }
  }
}

main()
  .catch((e) => {
    console.error('Fatal error in script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
