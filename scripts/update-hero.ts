import { prisma } from '../src/database/db';

async function main() {
  const heroTitle = 'TRADE SMART.<br />TRADE BETTER.<br /><span style="color: #0052e0;">GROW TOGETHER.</span>';
  const heroSubtitle = 'Smart Intraday Strategies, Real-time Scanners, and Powerful Tools to Elevate Your Trading Consistency.';

  console.log('Upserting hero_title...');
  await prisma.appSettings.upsert({
    where: { settingKey: 'hero_title' },
    update: { settingValue: heroTitle },
    create: { settingKey: 'hero_title', settingValue: heroTitle, type: 'string' }
  });

  console.log('Upserting hero_subtitle...');
  await prisma.appSettings.upsert({
    where: { settingKey: 'hero_subtitle' },
    update: { settingValue: heroSubtitle },
    create: { settingKey: 'hero_subtitle', settingValue: heroSubtitle, type: 'string' }
  });

  console.log('Hero settings successfully updated in the database!');
}

main()
  .catch((e) => {
    console.error('Error updating hero settings:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Note: Since Neon/Prisma connection pool runs, we don't strictly need to disconnect, but good practice.
  });
