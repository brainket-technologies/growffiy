import { prisma } from '../src/database/db';

async function main() {
  const strategy = await prisma.strategy.findFirst({ where: { name: 'Ten AM Strategy' } });
  if (strategy && strategy.configJson) {
    const config = JSON.parse(strategy.configJson as string);
    config.legs[0].tradeAction.selectPosition = 1;
    config.legs[1].tradeAction.selectPosition = 1;
    
    await prisma.strategy.update({
      where: { id: strategy.id },
      data: { configJson: JSON.stringify(config) }
    });
    console.log("JSON updated: selectPosition added to legs successfully!");
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
