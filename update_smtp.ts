import { prisma } from './src/database/db';

async function main() {
  const settings = [
    { key: 'smtp_host', value: 'smtp.gmail.com' },
    { key: 'smtp_port', value: '587' },
    { key: 'smtp_user', value: 'growffi.official@gmail.com' },
    { key: 'smtp_password', value: 'alxh giio mayx xuvu' },
    { key: 'smtp_sender_name', value: 'GROWFFI' },
    { key: 'smtp_encryption', value: 'tls' },
    { key: 'smtp_status', value: 'true' },
  ];

  for (const s of settings) {
    await prisma.appSettings.upsert({
      where: { settingKey: s.key },
      update: { settingValue: s.value },
      create: { settingKey: s.key, settingValue: s.value }
    });
    console.log(`Upserted ${s.key}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
