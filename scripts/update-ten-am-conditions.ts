import { prisma } from '../src/database/db';

async function main() {
  const strategy = await prisma.strategy.findFirst({ where: { name: 'Ten AM Strategy' } });
  if (strategy && strategy.configJson) {
    const config = JSON.parse(strategy.configJson as string);
    config.conditions = [];
    config.legs[0].tradeAction.candlePattern = "GRG";
    config.legs[1].tradeAction.candlePattern = "RGR";
    await prisma.strategy.update({
      where: { id: strategy.id },
      data: { configJson: JSON.stringify(config) }
    });
    console.log("Conditions cleared and candlePattern added to legs successfully!");
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
