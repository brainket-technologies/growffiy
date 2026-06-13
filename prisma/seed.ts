import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding default strategy and admin user...');

  // 1. Seed Strategy
  const strategy = await prisma.strategy.upsert({
    where: { id: 'pre-open-breakout' },
    update: {
      name: 'Pre-Open Momentum Breakout Strategy',
      description: 'Scans Nifty 200 candidates showing maximum gap-downs at 09:08 AM, buys high of 5-min candle close with 1% risk allocation.',
      status: 'active',
      configJson: JSON.stringify({
        candleSizeMinutes: 5,
        riskPercentage: 1.0,
        rewardRatio: 3.0,
        bufferPercent: 0.1,
        stopLossPercent: 0.5,
        targetPercent: 1.5
      })
    },
    create: {
      id: 'pre-open-breakout',
      name: 'Pre-Open Momentum Breakout Strategy',
      description: 'Scans Nifty 200 candidates showing maximum gap-downs at 09:08 AM, buys high of 5-min candle close with 1% risk allocation.',
      status: 'active',
      configJson: JSON.stringify({
        candleSizeMinutes: 5,
        riskPercentage: 1.0,
        rewardRatio: 3.0,
        bufferPercent: 0.1,
        stopLossPercent: 0.5,
        targetPercent: 1.5
      })
    }
  });
  console.log('Strategy seeded:', strategy.id);

  // 2. Seed Admin User
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

  // 3. Seed Subscription Plans
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
}

main()
  .catch((e) => {
    console.error('Error seeding DB via Prisma:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
