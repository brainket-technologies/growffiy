import { prisma } from '../src/database/db';

async function main() {
  const strategy = await prisma.strategy.findFirst({ where: { name: 'Ten AM Strategy' } });
  if (strategy && strategy.configJson) {
    const config = JSON.parse(strategy.configJson as string);
    
    // Remove unused fields
    delete config.basicInfo.selectPosition;
    delete config.basicInfo.checkIntervalSec;
    delete config.basicInfo.stockSelectionType;
    
    await prisma.strategy.update({
      where: { id: strategy.id },
      data: { configJson: JSON.stringify(config) }
    });
    console.log("Unused fields removed from Ten AM Strategy DB configuration successfully!");
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
