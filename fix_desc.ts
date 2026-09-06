import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool as PgPool } from 'pg';

async function main() {
  const connString = process.env.DIRECT_URL;
  const pool = new PgPool({ connectionString: connString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  await prisma.strategy.updateMany({
    where: { name: 'OH PREOPEN 15 MIN' },
    data: { description: 'Top Gainer Short on 1st Red Candle' }
  });

  console.log('Description fixed in DB');
  await prisma.$disconnect();
}

main().catch(console.error);
