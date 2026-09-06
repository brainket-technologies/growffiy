import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool as PgPool } from 'pg';

async function main() {
  const connString = process.env.DIRECT_URL;
  const pool = new PgPool({ connectionString: connString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const st = await prisma.strategy.findFirst({ where: { name: 'OH PREOPEN 15 MIN' } });
  if (!st) { console.log('Strategy not found'); return; }

  let config = JSON.parse(st.configJson);
  if (config.legs && config.legs.length > 0) {
    config.legs[0].timeframe = '15m';
  }

  await prisma.strategy.update({
    where: { id: st.id },
    data: { configJson: JSON.stringify(config) }
  });
  console.log('Updated strategy ID:', st.id);
  await prisma.$disconnect();
}

main().catch(console.error);
