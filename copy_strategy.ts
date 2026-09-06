import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool as PgPool } from 'pg';

async function main() {
  const connString = process.env.DIRECT_URL;
  const pool = new PgPool({ connectionString: connString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const orig = await prisma.strategy.findFirst({ where: { name: 'OH PREOPEN 1 MIN' } });
  if (!orig) { console.log('Original strategy not found'); return; }

  let config = JSON.parse(orig.configJson);
  
  if (config?.basicInfo?.name) {
    config.basicInfo.name = 'OH PREOPEN 15 MIN';
  }
  
  if (config.legs && config.legs.length > 0) {
    config.legs[0].entryTime = '09:30:00';
  }

  const newStrategy = await prisma.strategy.create({
    data: {
      name: 'OH PREOPEN 15 MIN',
      configJson: JSON.stringify(config),
      status: orig.status,
    }
  });
  console.log('Created strategy ID:', newStrategy.id);
  await prisma.$disconnect();
}

main().catch(console.error);
