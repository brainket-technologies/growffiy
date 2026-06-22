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

  // 1.5 Clean up old hardcoded IDs and seed auto-generated Product Types
  await prisma.subscriptionPlan.deleteMany({
    where: {
      id: {
        in: [
          'plan-monthly', 'plan-quarterly', 'plan-yearly',
          'plan-monthly-algo', 'plan-quarterly-algo', 'plan-yearly-algo',
          'plan-monthly-scanner', 'plan-quarterly-scanner', 'plan-yearly-scanner'
        ]
      }
    }
  });
  const prodAlgo = await prisma.productType.upsert({
    where: { id: 'prod-algo' },
    update: { name: 'Algo' },
    create: { id: 'prod-algo', name: 'Algo' }
  });
  console.log('ProductType seeded:', prodAlgo.id, prodAlgo.name);

  const prodScanner = await prisma.productType.upsert({
    where: { id: 'prod-scanner' },
    update: { name: 'Scanner' },
    create: { id: 'prod-scanner', name: 'Scanner' }
  });
  console.log('ProductType seeded:', prodScanner.id, prodScanner.name);

  // 2. Seed Subscription Plans
  const plans = [
    // Algo Plans
    {
      name: 'Algo Monthly Plan',
      price: 4999.00,
      durationDays: 30,
      features: JSON.stringify(['Pre-Open Momentum Strategy', '1% Capital Risk Guard', 'Zerodha Kite API Integration', 'Live Performance Dashboard', 'Email Support (48hr SLA)']),
      status: 'active',
      productTypeId: prodAlgo.id
    },
    {
      name: 'Algo Quarterly Plan',
      price: 12999.00,
      durationDays: 90,
      features: JSON.stringify(['Everything in Monthly', 'Telegram Trade Alerts', 'Priority API Setup Assistance', '1:3 Risk-Reward Configuration', 'Priority Support (12hr SLA)']),
      status: 'active',
      productTypeId: prodAlgo.id
    },
    {
      name: 'Algo Yearly Plan',
      price: 39999.00,
      durationDays: 365,
      features: JSON.stringify(['Everything in Quarterly', 'Dedicated Account Manager', 'Custom Strategy Parameters', 'Emergency Kill Switch Access', '24/7 Phone Support']),
      status: 'active',
      productTypeId: prodAlgo.id
    },
    // Scanner Plans
    {
      name: 'Scanner Monthly Plan',
      price: 1999.00,
      durationDays: 30,
      features: JSON.stringify(['Live Momentum Scanners', 'Multi-Indicator Alerts', 'Custom Watchlist Scans', 'Email Support (48hr SLA)']),
      status: 'active',
      productTypeId: prodScanner.id
    },
    {
      name: 'Scanner Quarterly Plan',
      price: 4999.00,
      durationDays: 90,
      features: JSON.stringify(['Everything in Monthly', 'Telegram Alert Webhooks', 'Unlimited Scans Per Day', 'Priority Support (12hr SLA)']),
      status: 'active',
      productTypeId: prodScanner.id
    },
    {
      name: 'Scanner Yearly Plan',
      price: 14999.00,
      durationDays: 365,
      features: JSON.stringify(['Everything in Quarterly', 'Custom Scanner Python API', '24/7 Phone Support']),
      status: 'active',
      productTypeId: prodScanner.id
    }
  ];

  for (const p of plans) {
    const existing = await prisma.subscriptionPlan.findFirst({
      where: { name: p.name }
    });
    
    if (!existing) {
      const plan = await prisma.subscriptionPlan.create({ data: p });
      console.log('Subscription plan created (Auto ID):', plan.id, plan.name);
    } else {
      const plan = await prisma.subscriptionPlan.update({
        where: { id: existing.id },
        data: p
      });
      console.log('Subscription plan updated:', plan.id, plan.name);
    }
  }

  // 3. Seed App Settings (Algo timings + Branding/SEO defaults)
  const appSettingsData = [
    { settingKey: 'algo_preopen_fetch_time', settingValue: '09:08', type: 'string' },
    { settingKey: 'algo_entry_time', settingValue: '09:20', type: 'string' },
    { settingKey: 'algo_token_refresh_time', settingValue: '08:00', type: 'string' },
    { settingKey: 'algo_check_interval_sec', settingValue: '60', type: 'string' },
    { settingKey: 'app_name', settingValue: 'Growffiy', type: 'string' },
    { settingKey: 'app_title', settingValue: 'Growffiy — Algo Trading Terminal', type: 'string' },
    { settingKey: 'app_favicon', settingValue: '', type: 'string' },
    { settingKey: 'app_logo', settingValue: '', type: 'string' },
    { settingKey: 'meta_description', settingValue: '', type: 'string' },
    { settingKey: 'meta_keywords', settingValue: '', type: 'string' },
    { settingKey: 'footer_text', settingValue: '', type: 'string' },
    { settingKey: 'google_analytics_id', settingValue: '', type: 'string' },
  ];

  for (const s of appSettingsData) {
    const setting = await prisma.appSettings.upsert({
      where: { settingKey: s.settingKey },
      update: { settingValue: s.settingValue, type: s.type },
      create: s
    });
    console.log('App setting seeded:', setting.settingKey);
  }

  // 4. Seed Default Strategy
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
          entryTime: '09:15',
          exitTime: '15:15',
          maxTradesPerDay: 3,
          status: 'active'
        },
        tradeAction: { action: 'Long', orderType: 'Limit', bufferPercent: 0.1 },
        stoploss: { type: 'Trailing SL', orderType: 'Market', fixedPercent: 0.5, fixedPoints: 5, trailingSL: 0.2, riskPercent: 1.0 },
        target: { type: 'Trailing Target', profitPercent: 1.5, riskRewardRatio: 3.0, partialExit: 50, trailingTarget: 0.5 },
        riskManagement: { capitalAllocation: 10.0, riskPerTrade: 1.0, maxDailyLoss: 5000, maxDailyProfit: 15000, maxOpenPositions: 2, killSwitch: false },
        conditions: [
          { logical: 'AND', indicator: 'Gap Down', operator: '>', value: '1.5' },
          { logical: 'AND', indicator: 'RSI', operator: '<', value: '30' }
        ]
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
          entryTime: '09:15',
          exitTime: '15:15',
          maxTradesPerDay: 3,
          status: 'active'
        },
        tradeAction: { action: 'Long', orderType: 'Limit', bufferPercent: 0.1 },
        stoploss: { type: 'Trailing SL', orderType: 'Market', fixedPercent: 0.5, fixedPoints: 5, trailingSL: 0.2, riskPercent: 1.0 },
        target: { type: 'Trailing Target', profitPercent: 1.5, riskRewardRatio: 3.0, partialExit: 50, trailingTarget: 0.5 },
        riskManagement: { capitalAllocation: 10.0, riskPerTrade: 1.0, maxDailyLoss: 5000, maxDailyProfit: 15000, maxOpenPositions: 2, killSwitch: false },
        conditions: [
          { logical: 'AND', indicator: 'Gap Down', operator: '>', value: '1.5' },
          { logical: 'AND', indicator: 'RSI', operator: '<', value: '30' }
        ]
      })
    }
  });
  console.log('Strategy seeded:', strategy.id);

  // 5. Seed Demo Clients
  console.log('Seeding demo clients...');
  const demoClients = [
    {
      name: 'Aman Sharma',
      email: 'aman.sharma@example.com',
      userId: 'aman_sharma',
      zerodhaClientId: 'IN30123456789012',
      accessToken: 'tok_active_aman_123',
      capital: 25000000.00,
      tradingStatus: 'active',
      subscriptionStatus: 'active',
      strategyId: 'pre-open-breakout',
      productTypeName: 'Algo'
    },
    {
      name: 'Rahul Kumar',
      email: 'rahul.kumar@example.com',
      userId: 'rahul_kumar',
      zerodhaClientId: 'IN30223456789012',
      accessToken: null,
      capital: 12750000.00,
      tradingStatus: 'inactive',
      subscriptionStatus: 'active',
      strategyId: 'pre-open-breakout',
      productTypeName: 'Algo'
    },
    {
      name: 'Neha Patel',
      email: 'neha.patel@example.com',
      userId: 'neha_patel',
      zerodhaClientId: 'IN30323456789012',
      accessToken: 'tok_expired_neha',
      capital: 500000.00,
      tradingStatus: 'inactive',
      subscriptionStatus: 'expired',
      strategyId: 'pre-open-breakout',
      productTypeName: 'Scanner'
    }
  ];

  for (const c of demoClients) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {
        name: c.name,
        userId: c.userId,
        password: '123',
        role: 'client',
        status: 'active'
      },
      create: {
        name: c.name,
        email: c.email,
        userId: c.userId,
        password: '123',
        role: 'client',
        status: 'active'
      }
    });

    const prodType = await prisma.productType.findUnique({
      where: { name: c.productTypeName }
    });

    const existingClient = await prisma.client.findUnique({
      where: { userId: user.id }
    });

    const clientData = {
      userId: user.id,
      zerodhaClientId: c.zerodhaClientId,
      accessToken: c.accessToken,
      capital: c.capital,
      tradingStatus: c.tradingStatus,
      subscriptionStatus: c.subscriptionStatus,
      strategyId: c.strategyId,
      productTypeId: prodType?.id || null
    };

    if (existingClient) {
      await prisma.client.update({
        where: { id: existingClient.id },
        data: clientData
      });
    } else {
      await prisma.client.create({
        data: clientData
      });
    }
  }
  console.log('Demo clients seeded successfully.');
}

main()
  .catch((e) => {
    console.error('Error seeding DB via Prisma:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
