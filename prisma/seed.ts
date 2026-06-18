import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import dotenv from 'dotenv';
import ws from 'ws';

dotenv.config();

// Enable WebSockets in node environment for Neon Serverless Driver
global.WebSocket = ws as any;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding admin user, plans, and settings...');

  // 1. Seed Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'firoz@gmail.com' },
    update: {
      name: 'Firoz Mohammad',
      userId: 'firoz',
      password: '123',
      role: 'admin',
      status: 'active'
    },
    create: {
      name: 'Firoz Mohammad',
      email: 'firoz@gmail.com',
      userId: 'firoz',
      password: '123',
      role: 'admin',
      status: 'active'
    }
  });
  console.log('Admin user seeded:', admin.email);

  // 2. Seed Subscription Plans
  const plans = [
    {
      id: 'plan-monthly',
      name: 'Monthly Plan',
      price: 4999.00,
      durationDays: 30,
      features: JSON.stringify(['Pre-Open Momentum Strategy', '1% Capital Risk Guard', 'Zerodha Kite API Integration', 'Live Performance Dashboard', 'Email Support (48hr SLA)']),
      status: 'active'
    },
    {
      id: 'plan-quarterly',
      name: 'Quarterly Plan',
      price: 12999.00,
      durationDays: 90,
      features: JSON.stringify(['Everything in Monthly', 'Telegram Trade Alerts', 'Priority API Setup Assistance', '1:3 Risk-Reward Configuration', 'Priority Support (12hr SLA)']),
      status: 'active'
    },
    {
      id: 'plan-yearly',
      name: 'Yearly Plan',
      price: 39999.00,
      durationDays: 365,
      features: JSON.stringify(['Everything in Quarterly', 'Dedicated Account Manager', 'Custom Strategy Parameters', 'Emergency Kill Switch Access', '24/7 Phone Support']),
      status: 'active'
    }
  ];

  for (const p of plans) {
    const plan = await prisma.subscriptionPlan.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        price: p.price,
        durationDays: p.durationDays,
        features: p.features,
        status: p.status
      },
      create: p
    });
    console.log('Subscription plan seeded:', plan.id);
  }

  // 3. Seed App Settings (Algo timings)
  const appSettingsData = [
    { settingKey: 'algo_preopen_fetch_time', settingValue: '09:08', type: 'string' },
    { settingKey: 'algo_entry_time', settingValue: '09:20', type: 'string' },
    { settingKey: 'algo_token_refresh_time', settingValue: '08:00', type: 'string' },
    { settingKey: 'algo_check_interval_sec', settingValue: '60', type: 'string' },
  ];

  for (const s of appSettingsData) {
    const setting = await prisma.appSettings.upsert({
      where: { settingKey: s.settingKey },
      update: { settingValue: s.settingValue, type: s.type },
      create: s
    });
    console.log('App setting seeded:', setting.settingKey);
  }
}

main()
  .catch((e) => {
    console.error('Error seeding DB via Prisma:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
