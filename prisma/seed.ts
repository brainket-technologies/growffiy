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
  console.log('Seeding default strategy and admin user...');

  // 1. Seed Strategy
  const strategy = await prisma.strategy.upsert({
    where: { id: 'pre-open-breakout' },
    update: {
      name: 'Pre-Open Momentum Breakout',
      description: 'Scans Nifty 200 for maximum gap-downs at 09:08 AM, buys high of 5-min candle with 1% risk.',
      status: 'active',
      configJson: JSON.stringify({
        basicInfo: {
          name: 'Pre-Open Momentum Breakout',
          description: 'Scans Nifty 200 for maximum gap-downs at 09:08 AM, buys high of 5-min candle with 1% risk.',
          tradeType: 'Intraday',
          exchange: 'NSE',
          segment: 'NSE F&O',
          timeframe: '5m',
          entryTime: '09:20',
          exitTime: '15:15',
          maxTradesPerDay: 3,
          status: 'active'
        },
        tradeAction: { action: 'Long', orderType: 'Limit', bufferPercent: 0.1 },
        stoploss: { type: 'Trailing SL', orderType: 'Market', fixedPercent: 0.5, fixedPoints: 5, trailingSL: 0.2, riskPercent: 1.0 },
        target: { type: 'Trailing Target', profitPercent: 1.5, riskRewardRatio: 3.0, partialExit: 50, trailingTarget: 0.5 },
        riskManagement: { capitalAllocation: 10.0, riskPerTrade: 1.0, maxDailyLoss: 5000, maxDailyProfit: 15000, maxOpenPositions: 2, killSwitch: false },
        conditions: []
      })
    },
    create: {
      id: 'pre-open-breakout',
      name: 'Pre-Open Momentum Breakout',
      description: 'Scans Nifty 200 for maximum gap-downs at 09:08 AM, buys high of 5-min candle with 1% risk.',
      status: 'active',
      configJson: JSON.stringify({
        basicInfo: {
          name: 'Pre-Open Momentum Breakout',
          description: 'Scans Nifty 200 for maximum gap-downs at 09:08 AM, buys high of 5-min candle with 1% risk.',
          tradeType: 'Intraday',
          exchange: 'NSE',
          segment: 'NSE F&O',
          timeframe: '5m',
          entryTime: '09:20',
          exitTime: '15:15',
          maxTradesPerDay: 3,
          status: 'active'
        },
        tradeAction: { action: 'Long', orderType: 'Limit', bufferPercent: 0.1 },
        stoploss: { type: 'Trailing SL', orderType: 'Market', fixedPercent: 0.5, fixedPoints: 5, trailingSL: 0.2, riskPercent: 1.0 },
        target: { type: 'Trailing Target', profitPercent: 1.5, riskRewardRatio: 3.0, partialExit: 50, trailingTarget: 0.5 },
        riskManagement: { capitalAllocation: 10.0, riskPerTrade: 1.0, maxDailyLoss: 5000, maxDailyProfit: 15000, maxOpenPositions: 2, killSwitch: false },
        conditions: []
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

  // 4. Seed App Settings (Algo timings)
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
