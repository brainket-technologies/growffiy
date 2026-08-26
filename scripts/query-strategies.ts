import { prisma } from '../src/database/db';

async function main() {
  const strategies = await prisma.strategy.findMany();
  console.log("Strategies:", JSON.stringify(strategies, null, 2));
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
