import { prisma } from '../src/database/db';

async function main() {
  const strategy = await prisma.strategy.findFirst({ where: { name: 'Ten AM Strategy' } });
  if (strategy && strategy.configJson) {
    const config = JSON.parse(strategy.configJson as string);
    
    // Update segment to Nifty 500
    config.basicInfo.segment = "Nifty 500";
    
    await prisma.strategy.update({
      where: { id: strategy.id },
      data: { configJson: JSON.stringify(config) }
    });
    console.log("Segment updated to Nifty 500 for Ten AM Strategy DB configuration successfully!");
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
