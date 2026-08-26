import { prisma } from '../src/database/db';

async function main() {
  const strategy = await prisma.strategy.findFirst({ where: { name: 'Ten AM Strategy' } });
  if (strategy && strategy.configJson) {
    const config = JSON.parse(strategy.configJson as string);
    config.basicInfo.topCount = 20;
    
    await prisma.strategy.update({
      where: { id: strategy.id },
      data: { configJson: JSON.stringify(config) }
    });
    console.log("JSON updated: topCount added to basicInfo successfully!");
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
