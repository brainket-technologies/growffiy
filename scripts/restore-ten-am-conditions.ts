import { prisma } from '../src/database/db';

async function main() {
  const strategy = await prisma.strategy.findFirst({ where: { name: 'Ten AM Strategy' } });
  if (strategy && strategy.configJson) {
    const config = JSON.parse(strategy.configJson as string);
    config.conditions = [
      {
        "value": "-10",
        "logical": "AND",
        "operator": ">",
        "indicator": "Pre Open Change %"
      }
    ];
    await prisma.strategy.update({
      where: { id: strategy.id },
      data: { configJson: JSON.stringify(config) }
    });
    console.log("Conditions restored successfully!");
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
