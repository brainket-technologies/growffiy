import { prisma } from './src/database/db';
async function main() {
  const st = await prisma.strategy.findFirst({ where: { name: 'OH PREOPEN 15 MIN' } });
  if (st) {
    console.log(JSON.stringify(JSON.parse(st.configJson), null, 2));
  }
}
main();
