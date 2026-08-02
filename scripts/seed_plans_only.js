const { prisma } = require('./src/database/db');

async function main() {
  console.log('Seeding Product Types, Subscription Plans, App Settings, and Strategy Templates...');
  
  // 1. Product Types
  await prisma.productType.upsert({
    where: { id: 'prod-algo' },
    update: { name: 'Algo' },
    create: { id: 'prod-algo', name: 'Algo' },
  });

  await prisma.productType.upsert({
    where: { id: 'prod-scanner' },
    update: { name: 'Scanner' },
    create: { id: 'prod-scanner', name: 'Scanner' },
  });

  // 2. Subscription Plans
  const plans = [
    {
      id: '73a18efe-9128-49dc-b658-6147133698b9',
      name: 'Algo Monthly Plan',
      price: '4999',
      durationDays: 30,
      features: JSON.stringify([
        "Pre-Open Momentum Strategy",
        "1% Capital Risk Guard",
        "Zerodha Kite API Integration",
        "Live Performance Dashboard",
        "Email Support (48hr SLA)"
      ]),
      status: 'active',
      productTypeId: 'prod-algo'
    },
    {
      id: '5520ea32-3f93-4577-8e9a-8e77d0a72ffa',
      name: 'Algo Quarterly Plan',
      price: '12999',
      durationDays: 90,
      features: JSON.stringify([
        "Everything in Monthly",
        "Telegram Trade Alerts",
        "Priority API Setup Assistance",
        "1:3 Risk-Reward Configuration",
        "Priority Support (12hr SLA)"
      ]),
      status: 'active',
      productTypeId: 'prod-algo'
    },
    {
      id: 'bdf048df-ef68-4118-a9df-90b5eb974b8a',
      name: 'Algo Yearly Plan',
      price: '39999',
      durationDays: 365,
      features: JSON.stringify([
        "Everything in Quarterly",
        "Dedicated Account Manager",
        "Custom Strategy Parameters",
        "Emergency Kill Switch Access",
        "24/7 Phone Support"
      ]),
      status: 'active',
      productTypeId: 'prod-algo'
    },
    {
      id: '867bcedb-6cfa-4f6c-b08b-283f1d8087e5',
      name: 'Scanner Monthly Plan',
      price: '1999',
      durationDays: 30,
      features: JSON.stringify([
        "Live Momentum Scanners",
        "Multi-Indicator Alerts",
        "Custom Watchlist Scans",
        "Email Support (48hr SLA)"
      ]),
      status: 'active',
      productTypeId: 'prod-scanner'
    },
    {
      id: '6e547451-dcb7-4abe-ad50-320d7a09978b',
      name: 'Scanner Quarterly Plan',
      price: '4999',
      durationDays: 90,
      features: JSON.stringify([
        "Everything in Monthly",
        "Telegram Alert Webhooks",
        "Unlimited Scans Per Day",
        "Priority Support (12hr SLA)"
      ]),
      status: 'active',
      productTypeId: 'prod-scanner'
    },
    {
      id: 'bac29e96-8de1-4d0b-8e80-7e3f750d8b1d',
      name: 'Scanner Yearly Plan',
      price: '14999',
      durationDays: 365,
      features: JSON.stringify([
        "Everything in Quarterly",
        "Custom Scanner Python API",
        "24/7 Phone Support"
      ]),
      status: 'active',
      productTypeId: 'prod-scanner'
    }
  ];

  for (const p of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { id: p.id },
      update: p,
      create: p,
    });
  }

  // 3. App Settings (Razorpay, SMTP, Timings, App branding)
  const settings = [
    { id: '7e370e4c-da09-4f58-983f-5787ada81590', settingKey: 'razorpay_test_key_id', settingValue: 'rzp_test_T17dGCGWmqwnLG', type: 'string' },
    { id: 'bef3c6ef-c44d-459b-8839-42576ff76bcb', settingKey: 'razorpay_test_key_secret', settingValue: 'cg1a00OrYs4Wn7gD7YE93jXD', type: 'string' },
    { id: 'd28caef2-bc4e-42ba-86fc-dd372c428a1e', settingKey: 'razorpay_live_key_id', settingValue: 'rzp_live_T17esLJpmNRSmQ', type: 'string' },
    { id: '0d00bda1-6285-4563-8fbc-28322287a1ce', settingKey: 'razorpay_live_key_secret', settingValue: 'YOURSMiQx7v4pQadX5a5LAeQ', type: 'string' },
    { id: '957fdeec-3225-4c12-930d-47abacdc487e', settingKey: 'razorpay_mode', settingValue: 'test', type: 'string' },
    { id: '94676b3d-a2bf-441b-ae4e-c10fb477d072', settingKey: 'smtp_host', settingValue: '', type: 'string' },
    { id: '470fcd65-4ca6-4829-beca-45650c3bbb32', settingKey: 'smtp_port', settingValue: '587', type: 'string' },
    { id: 'a81be59b-d350-4807-81e7-b88fc0d760d8', settingKey: 'smtp_user', settingValue: '', type: 'string' },
    { id: '8ce76109-33d0-46cf-9256-f23fb4a1c1c3', settingKey: 'smtp_password', settingValue: '', type: 'string' },
    { id: 'e6c7bda0-716e-48da-9c8a-73b8dd4f856c', settingKey: 'smtp_sender_name', settingValue: 'Growffiy', type: 'string' },
    { id: '2eb3fc15-3e89-4d13-91e4-842417c3810e', settingKey: 'smtp_encryption', settingValue: 'tls', type: 'string' },
    { id: '87594b21-70bb-44d5-85df-ca3042dd30e8', settingKey: 'smtp_status', settingValue: 'false', type: 'string' },
    { id: '3c7d6b7f-c7f1-4026-9695-c35e01b9cdb8', settingKey: 'support_email', settingValue: 'support@growffiy.com', type: 'string' },
    { id: '000cbf6f-4f56-4478-bac4-4dc41385d23b', settingKey: 'support_phone', settingValue: '+91 9026663052', type: 'string' },
    { id: '08dd1962-7f47-4a38-bc25-bec4783249b7', settingKey: 'support_timings', settingValue: 'Live Chat (Mon-Fri, 9:00 AM - 3:30 PM)', type: 'string' },
    { id: '4b9fe07a-a46a-4ba3-b1ee-4635ac483e75', settingKey: 'PRE_OPEN_QUOTES_DATA', settingValue: '{"quotes":[]}', type: 'json' },
    { id: '3813bc5c-1170-4b6c-b7eb-6b27c9947c84', settingKey: 'isTradingActive', settingValue: 'true', type: 'boolean' },
    { id: 'da2a7128-b9d3-4083-ab10-fc86227f748a', settingKey: 'algo_preopen_fetch_time', settingValue: '09:08', type: 'string' },
    { id: '31244e8c-378c-4b9e-b94a-fabd7e1e94e2', settingKey: 'algo_entry_time', settingValue: '09:20:30', type: 'string' },
    { id: 'b044cde0-d7f8-4c2a-bc99-a209f8296cda', settingKey: 'algo_token_refresh_time', settingValue: '08:00', type: 'string' },
    { id: '9895f66a-2049-4d51-85f3-2dd78e358c57', settingKey: 'algo_check_interval_sec', settingValue: '60', type: 'string' },
    { id: '16ded507-6030-478a-8ca6-de6f76348a2a', settingKey: 'auto_trade_enabled', settingValue: 'true', type: 'string' },
    { id: 'c81ddaab-b729-4732-ad24-bd42e50d0ede', settingKey: 'trading_days', settingValue: '["Mon","Tue","Wed","Thu","Fri"]', type: 'string' },
    { id: 'f8cceaea-59a0-47c2-8a77-cf91f569f463', settingKey: 'special_market_days', settingValue: '[]', type: 'string' },
    { id: '915db754-9bfd-45ec-a780-776834c8d681', settingKey: 'market_holidays', settingValue: '[{"date":"2026-06-26","name":"Muharram"}]', type: 'string' },
    { id: '3cd6d731-646b-41e0-9b02-eb7d238cea4e', settingKey: 'app_name', settingValue: 'Growffi', type: 'string' },
    { id: '0daab40f-3239-432d-8d3c-0388fd7062f4', settingKey: 'app_title', settingValue: 'Growffiy — ', type: 'string' },
    { id: '248a11d6-03e0-4982-81e9-6ba91f59ba6c', settingKey: 'app_favicon', settingValue: '', type: 'string' },
    { id: '2e8ea13a-bd1b-4439-b744-aa4fa56091c0', settingKey: 'app_logo', settingValue: '', type: 'string' }
  ];

  for (const s of settings) {
    await prisma.appSettings.upsert({
      where: { id: s.id },
      update: s,
      create: s,
    });
  }

  // 4. Full Strategy Template ("Pre-Open Momentum Breakout")
  const fullStrategyConfig = {
    basicInfo: {
      name: "Pre-Open Momentum Breakout",
      status: "active",
      segment: "NSE F&O",
      exchange: "NSE",
      preSelectTime: "09:15:30",
      selectPosition: 1,
      tradeType: "Intraday",
      checkIntervalSec: 60,
      description: "Pre-Open Momentum Breakout Strategy",
      exitTime: "15:15:00"
    },
    stoploss: {
      type: "Fixed %",
      orderType: "Market",
      fixedPercent: 1,
      fixedPoints: 10,
      trailingSL: -1,
      riskPercent: 1
    },
    target: {
      type: "Trailing Target",
      profitPercent: 2,
      riskRewardRatio: 2,
      partialExit: 100,
      trailingTarget: -1
    },
    riskManagement: {
      riskPerTrade: 1,
      killSwitch: false,
      maxOpenPositions: 3,
      maxDailyLoss: -1,
      maxDailyProfit: -1,
      capitalAllocation: -1,
      misMarginRate: -1
    },
    conditions: [
      { value: "-10", logical: "AND", operator: ">", indicator: "Pre Open Change %" }
    ],
    legs: [
      {
        name: "Leg 1",
        enabled: true,
        entryTime: "09:20:30",
        timeframe: "5m",
        tradeAction: { action: "Long", orderType: "SL-Market", bufferPercent: 0.1, candlePriceType: "high" }
      },
      {
        name: "Leg 2",
        enabled: false,
        entryTime: "09:30:00",
        timeframe: "15m",
        tradeAction: { action: "Short", orderType: "SL-Market", bufferPercent: 0.1, candlePriceType: "low" }
      }
    ]
  };

  await prisma.strategy.upsert({
    where: { id: 'c7bafa89-3403-44c3-bcd0-199602c878e1' },
    update: {
      name: 'Pre-Open Momentum Breakout',
      description: 'Pre-Open Momentum Breakout Strategy',
      status: 'active',
      configJson: JSON.stringify(fullStrategyConfig)
    },
    create: {
      id: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      name: 'Pre-Open Momentum Breakout',
      description: 'Pre-Open Momentum Breakout Strategy',
      status: 'active',
      configJson: JSON.stringify(fullStrategyConfig)
    }
  });

  // Ensure conditions table also has the condition
  await prisma.strategyCondition.deleteMany({
    where: { strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1' }
  });
  await prisma.strategyCondition.create({
    data: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      logical: 'AND',
      indicator: 'Pre Open Change %',
      operator: '>',
      value: '-10'
    }
  });

  console.log('Successfully seeded Product Types, Subscription Plans, App Settings, and Full Strategy Config!');
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
