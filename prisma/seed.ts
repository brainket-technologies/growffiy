import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import dotenv from 'dotenv';
import ws from 'ws';

dotenv.config();

global.WebSocket = ws as any;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding exact Neon data...\n');

  // ──────────────────────────────────────────────
  // 1. Product Types
  // ──────────────────────────────────────────────
  await prisma.productType.upsert({
    where: { id: 'prod-algo' },
    update: {
      name: 'Algo'
    },
    create: {
      id: 'prod-algo',
      name: 'Algo'
    },
  });
  await prisma.productType.upsert({
    where: { id: 'prod-scanner' },
    update: {
      name: 'Scanner'
    },
    create: {
      id: 'prod-scanner',
      name: 'Scanner'
    },
  });
  console.log('productType: 2');


  // ──────────────────────────────────────────────
  // 2. Users
  // ──────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'vikash@gmail.com' },
    update: {
      id: '846d4c97-be94-4a06-a72c-c048daf71e3c',
      name: 'Vikash sharma',
      mobile: null,
      userId: 'vikashsharma162',
      password: 'grw_QyWf8D2n',
      role: 'client',
      status: 'active'
    },
    create: {
      id: '846d4c97-be94-4a06-a72c-c048daf71e3c',
      name: 'Vikash sharma',
      email: 'vikash@gmail.com',
      mobile: null,
      userId: 'vikashsharma162',
      password: 'grw_QyWf8D2n',
      role: 'client',
      status: 'active'
    },
  });
  await prisma.user.upsert({
    where: { email: 'firoz@gmail.com' },
    update: {
      id: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      name: 'Firoz Mohammad',
      mobile: null,
      userId: 'firoz',
      password: '123',
      role: 'admin',
      status: 'active'
    },
    create: {
      id: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      name: 'Firoz Mohammad',
      email: 'firoz@gmail.com',
      mobile: null,
      userId: 'firoz',
      password: '123',
      role: 'admin',
      status: 'active'
    },
  });
  console.log('user: 2');


  // ──────────────────────────────────────────────
  // 3. Strategy
  // ──────────────────────────────────────────────
  await prisma.strategy.upsert({
    where: { id: 'c7bafa89-3403-44c3-bcd0-199602c878e1' },
    update: {
      name: 'Pre-Open Momentum Breakout',
      description: 'Pre-Open Momentum Breakout Strategy',
      status: 'active',
      configJson: '{"basicInfo":{"name":"Pre-Open Momentum Breakout","status":"active","segment":"NSE F&O","exchange":"NSE","preSelectTime":"09:15:30","selectPosition":1,"tradeType":"Intraday","checkIntervalSec":60,"description":"Pre-Open Momentum Breakout Strategy","exitTime":"15:15:00"},"stoploss":{"type":"Fixed %","orderType":"Market","fixedPercent":1,"fixedPoints":10,"trailingSL":-1,"riskPercent":1},"target":{"type":"Trailing Target","profitPercent":2,"riskRewardRatio":2,"partialExit":100,"trailingTarget":-1},"riskManagement":{"riskPerTrade":1,"killSwitch":false,"maxOpenPositions":3,"maxDailyLoss":-1,"maxDailyProfit":-1,"capitalAllocation":-1,"misMarginRate":-1},"conditions":[{"value":"-10","logical":"AND","operator":">","indicator":"Pre Open Change %"}],"legs":[{"name":"Leg 1","enabled":true,"entryTime":"09:20:30","timeframe":"5m","tradeAction":{"action":"Long","orderType":"SL-Market","bufferPercent":0.1,"candlePriceType":"high"}},{"name":"Leg 2","enabled":false,"entryTime":"09:30:00","timeframe":"15m","tradeAction":{"action":"Short","orderType":"SL-Market","bufferPercent":0.1,"candlePriceType":"low"}}]}'
    },
    create: {
      id: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      name: 'Pre-Open Momentum Breakout',
      description: 'Pre-Open Momentum Breakout Strategy',
      status: 'active',
      configJson: '{"basicInfo":{"name":"Pre-Open Momentum Breakout","status":"active","segment":"NSE F&O","exchange":"NSE","preSelectTime":"09:15:30","selectPosition":1,"tradeType":"Intraday","checkIntervalSec":60,"description":"Pre-Open Momentum Breakout Strategy","exitTime":"15:15:00"},"stoploss":{"type":"Fixed %","orderType":"Market","fixedPercent":1,"fixedPoints":10,"trailingSL":-1,"riskPercent":1},"target":{"type":"Trailing Target","profitPercent":2,"riskRewardRatio":2,"partialExit":100,"trailingTarget":-1},"riskManagement":{"riskPerTrade":1,"killSwitch":false,"maxOpenPositions":3,"maxDailyLoss":-1,"maxDailyProfit":-1,"capitalAllocation":-1,"misMarginRate":-1},"conditions":[{"value":"-10","logical":"AND","operator":">","indicator":"Pre Open Change %"}],"legs":[{"name":"Leg 1","enabled":true,"entryTime":"09:20:30","timeframe":"5m","tradeAction":{"action":"Long","orderType":"SL-Market","bufferPercent":0.1,"candlePriceType":"high"}},{"name":"Leg 2","enabled":false,"entryTime":"09:30:00","timeframe":"15m","tradeAction":{"action":"Short","orderType":"SL-Market","bufferPercent":0.1,"candlePriceType":"low"}}]}'
    },
  });
  console.log('strategy: 1');


  // ──────────────────────────────────────────────
  // 4. Client
  // ──────────────────────────────────────────────
  await prisma.client.upsert({
    where: { id: 'b364d72f-e2e2-4dbc-bbef-3286c75e1875' },
    update: {
      userId: '846d4c97-be94-4a06-a72c-c048daf71e3c',
      zerodhaClientId: 'RZJ500',
      accessToken: 'lJo5d5dEp2kEIFervXTenRB99nstLKvc',
      capital: '"100000"',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      tradingStatus: 'active',
      subscriptionStatus: 'active',
      zerodhaApiKey: '4y7j026qyv9lkacw',
      zerodhaApiSecret: 'xr2qwbkkn0kj8gbuzuwyn19ggxlxgye9',
      zerodhaSession: '{"user_type":"individual/ind_with_nom","email":"js9650141@gmail.com","user_name":"Janvi Sharma","user_shortname":"Janvi","broker":"ZERODHA","exchanges":["BSE","MF","NSE"],"products":["CNC","NRML","MIS","BO","CO"],"order_types":["MARKET","LIMIT","SL","SL-M"],"avatar_url":null,"user_id":"RZJ500","api_key":"4y7j026qyv9lkacw","access_token":"lJo5d5dEp2kEIFervXTenRB99nstLKvc","public_token":"ILcBD8LlEFB4zDfyedP2JcxIXWcjfVVV","refresh_token":"","enctoken":"mrfxqyEsLQ8Gw9WPPMNuQCee6+P83GBUDstuucZHyhQMS9XwVqpIiHVGZgdwlTruApCnVaslVBAKURmAxO92WWdLZt5xxWv9+a0yvFVr3BM1CUIfSQDvhjM+CbNzl6o=","login_time":"2026-06-29 08:23:59","meta":{"demat_consent":"consent"}}',
      zerodhaPassword: '987654321',
      zerodhaTotpSecret: 'JT5PXX4UOZZYNHTV7X525T6QSA4QNQDQ',
      aadhaarNumber: '',
      dob: '',
      kycStatus: 'verified',
      panNumber: '',
      productTypeId: 'prod-algo'
    },
    create: {
      id: 'b364d72f-e2e2-4dbc-bbef-3286c75e1875',
      userId: '846d4c97-be94-4a06-a72c-c048daf71e3c',
      zerodhaClientId: 'RZJ500',
      accessToken: 'lJo5d5dEp2kEIFervXTenRB99nstLKvc',
      capital: '"100000"',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      tradingStatus: 'active',
      subscriptionStatus: 'active',
      zerodhaApiKey: '4y7j026qyv9lkacw',
      zerodhaApiSecret: 'xr2qwbkkn0kj8gbuzuwyn19ggxlxgye9',
      zerodhaSession: '{"user_type":"individual/ind_with_nom","email":"js9650141@gmail.com","user_name":"Janvi Sharma","user_shortname":"Janvi","broker":"ZERODHA","exchanges":["BSE","MF","NSE"],"products":["CNC","NRML","MIS","BO","CO"],"order_types":["MARKET","LIMIT","SL","SL-M"],"avatar_url":null,"user_id":"RZJ500","api_key":"4y7j026qyv9lkacw","access_token":"lJo5d5dEp2kEIFervXTenRB99nstLKvc","public_token":"ILcBD8LlEFB4zDfyedP2JcxIXWcjfVVV","refresh_token":"","enctoken":"mrfxqyEsLQ8Gw9WPPMNuQCee6+P83GBUDstuucZHyhQMS9XwVqpIiHVGZgdwlTruApCnVaslVBAKURmAxO92WWdLZt5xxWv9+a0yvFVr3BM1CUIfSQDvhjM+CbNzl6o=","login_time":"2026-06-29 08:23:59","meta":{"demat_consent":"consent"}}',
      zerodhaPassword: '987654321',
      zerodhaTotpSecret: 'JT5PXX4UOZZYNHTV7X525T6QSA4QNQDQ',
      aadhaarNumber: '',
      dob: '',
      kycStatus: 'verified',
      panNumber: '',
      productTypeId: 'prod-algo'
    },
  });
  console.log('client: 1');


  // ──────────────────────────────────────────────
  // 5. Subscription Plans
  // ──────────────────────────────────────────────
  await prisma.subscriptionPlan.upsert({
    where: { id: '73a18efe-9128-49dc-b658-6147133698b9' },
    update: {
      name: 'Algo Monthly Plan',
      price: '"4999"',
      durationDays: 30,
      features: '["Pre-Open Momentum Strategy","1% Capital Risk Guard","Zerodha Kite API Integration","Live Performance Dashboard","Email Support (48hr SLA)"]',
      status: 'active',
      productTypeId: 'prod-algo'
    },
    create: {
      id: '73a18efe-9128-49dc-b658-6147133698b9',
      name: 'Algo Monthly Plan',
      price: '"4999"',
      durationDays: 30,
      features: '["Pre-Open Momentum Strategy","1% Capital Risk Guard","Zerodha Kite API Integration","Live Performance Dashboard","Email Support (48hr SLA)"]',
      status: 'active',
      productTypeId: 'prod-algo'
    },
  });
  await prisma.subscriptionPlan.upsert({
    where: { id: '5520ea32-3f93-4577-8e9a-8e77d0a72ffa' },
    update: {
      name: 'Algo Quarterly Plan',
      price: '"12999"',
      durationDays: 90,
      features: '["Everything in Monthly","Telegram Trade Alerts","Priority API Setup Assistance","1:3 Risk-Reward Configuration","Priority Support (12hr SLA)"]',
      status: 'active',
      productTypeId: 'prod-algo'
    },
    create: {
      id: '5520ea32-3f93-4577-8e9a-8e77d0a72ffa',
      name: 'Algo Quarterly Plan',
      price: '"12999"',
      durationDays: 90,
      features: '["Everything in Monthly","Telegram Trade Alerts","Priority API Setup Assistance","1:3 Risk-Reward Configuration","Priority Support (12hr SLA)"]',
      status: 'active',
      productTypeId: 'prod-algo'
    },
  });
  await prisma.subscriptionPlan.upsert({
    where: { id: 'bdf048df-ef68-4118-a9df-90b5eb974b8a' },
    update: {
      name: 'Algo Yearly Plan',
      price: '"39999"',
      durationDays: 365,
      features: '["Everything in Quarterly","Dedicated Account Manager","Custom Strategy Parameters","Emergency Kill Switch Access","24/7 Phone Support"]',
      status: 'active',
      productTypeId: 'prod-algo'
    },
    create: {
      id: 'bdf048df-ef68-4118-a9df-90b5eb974b8a',
      name: 'Algo Yearly Plan',
      price: '"39999"',
      durationDays: 365,
      features: '["Everything in Quarterly","Dedicated Account Manager","Custom Strategy Parameters","Emergency Kill Switch Access","24/7 Phone Support"]',
      status: 'active',
      productTypeId: 'prod-algo'
    },
  });
  await prisma.subscriptionPlan.upsert({
    where: { id: '867bcedb-6cfa-4f6c-b08b-283f1d8087e5' },
    update: {
      name: 'Scanner Monthly Plan',
      price: '"1999"',
      durationDays: 30,
      features: '["Live Momentum Scanners","Multi-Indicator Alerts","Custom Watchlist Scans","Email Support (48hr SLA)"]',
      status: 'active',
      productTypeId: 'prod-scanner'
    },
    create: {
      id: '867bcedb-6cfa-4f6c-b08b-283f1d8087e5',
      name: 'Scanner Monthly Plan',
      price: '"1999"',
      durationDays: 30,
      features: '["Live Momentum Scanners","Multi-Indicator Alerts","Custom Watchlist Scans","Email Support (48hr SLA)"]',
      status: 'active',
      productTypeId: 'prod-scanner'
    },
  });
  await prisma.subscriptionPlan.upsert({
    where: { id: '6e547451-dcb7-4abe-ad50-320d7a09978b' },
    update: {
      name: 'Scanner Quarterly Plan',
      price: '"4999"',
      durationDays: 90,
      features: '["Everything in Monthly","Telegram Alert Webhooks","Unlimited Scans Per Day","Priority Support (12hr SLA)"]',
      status: 'active',
      productTypeId: 'prod-scanner'
    },
    create: {
      id: '6e547451-dcb7-4abe-ad50-320d7a09978b',
      name: 'Scanner Quarterly Plan',
      price: '"4999"',
      durationDays: 90,
      features: '["Everything in Monthly","Telegram Alert Webhooks","Unlimited Scans Per Day","Priority Support (12hr SLA)"]',
      status: 'active',
      productTypeId: 'prod-scanner'
    },
  });
  await prisma.subscriptionPlan.upsert({
    where: { id: 'bac29e96-8de1-4d0b-8e80-7e3f750d8b1d' },
    update: {
      name: 'Scanner Yearly Plan',
      price: '"14999"',
      durationDays: 365,
      features: '["Everything in Quarterly","Custom Scanner Python API","24/7 Phone Support"]',
      status: 'active',
      productTypeId: 'prod-scanner'
    },
    create: {
      id: 'bac29e96-8de1-4d0b-8e80-7e3f750d8b1d',
      name: 'Scanner Yearly Plan',
      price: '"14999"',
      durationDays: 365,
      features: '["Everything in Quarterly","Custom Scanner Python API","24/7 Phone Support"]',
      status: 'active',
      productTypeId: 'prod-scanner'
    },
  });
  console.log('subscriptionPlan: 6');


  // ──────────────────────────────────────────────
  // 6. Subscriptions
  // ──────────────────────────────────────────────
  await prisma.subscription.upsert({
    where: { id: 'c3f8dbc4-b90b-49c3-99da-ab6a2bd1c5a4' },
    update: {
      userId: '846d4c97-be94-4a06-a72c-c048daf71e3c',
      planId: '73a18efe-9128-49dc-b658-6147133698b9',
      startDate: new Date('2026-06-21T23:11:06.603Z'),
      endDate: new Date('2026-07-21T23:11:06.603Z'),
      status: 'active'
    },
    create: {
      id: 'c3f8dbc4-b90b-49c3-99da-ab6a2bd1c5a4',
      userId: '846d4c97-be94-4a06-a72c-c048daf71e3c',
      planId: '73a18efe-9128-49dc-b658-6147133698b9',
      startDate: new Date('2026-06-21T23:11:06.603Z'),
      endDate: new Date('2026-07-21T23:11:06.603Z'),
      status: 'active'
    },
  });
  console.log('subscription: 1');


  // ──────────────────────────────────────────────
  // 7. Payments
  // ──────────────────────────────────────────────
  await prisma.payment.upsert({
    where: { id: '5bfc219b-d1ce-45f6-b5f4-91fa3f5096bd' },
    update: {
      userId: '846d4c97-be94-4a06-a72c-c048daf71e3c',
      planId: '73a18efe-9128-49dc-b658-6147133698b9',
      amount: '"4999"',
      razorpayOrderId: 'order_T4SRKLgGO23GOz',
      razorpayPaymentId: 'pay_T4SRY7IpT4xup4',
      status: 'success',
      paymentDate: new Date('2026-06-21T23:11:06.353Z')
    },
    create: {
      id: '5bfc219b-d1ce-45f6-b5f4-91fa3f5096bd',
      userId: '846d4c97-be94-4a06-a72c-c048daf71e3c',
      planId: '73a18efe-9128-49dc-b658-6147133698b9',
      amount: '"4999"',
      razorpayOrderId: 'order_T4SRKLgGO23GOz',
      razorpayPaymentId: 'pay_T4SRY7IpT4xup4',
      status: 'success',
      paymentDate: new Date('2026-06-21T23:11:06.353Z')
    },
  });
  console.log('payment: 1');


  // ──────────────────────────────────────────────
  // 8. App Settings
  // ──────────────────────────────────────────────
  await prisma.appSettings.upsert({
    where: { id: '7e370e4c-da09-4f58-983f-5787ada81590' },
    update: {
      settingKey: 'razorpay_test_key_id',
      settingValue: 'rzp_test_T17dGCGWmqwnLG',
      type: 'string'
    },
    create: {
      id: '7e370e4c-da09-4f58-983f-5787ada81590',
      settingKey: 'razorpay_test_key_id',
      settingValue: 'rzp_test_T17dGCGWmqwnLG',
      type: 'string'
    },
  });
  await prisma.appSettings.upsert({
    where: { id: 'bef3c6ef-c44d-459b-8839-42576ff76bcb' },
    update: {
      settingKey: 'razorpay_test_key_secret',
      settingValue: 'cg1a00OrYs4Wn7gD7YE93jXD',
      type: 'string'
    },
    create: {
      id: 'bef3c6ef-c44d-459b-8839-42576ff76bcb',
      settingKey: 'razorpay_test_key_secret',
      settingValue: 'cg1a00OrYs4Wn7gD7YE93jXD',
      type: 'string'
    },
  });
  await prisma.appSettings.upsert({
    where: { id: 'd28caef2-bc4e-42ba-86fc-dd372c428a1e' },
    update: {
      settingKey: 'razorpay_live_key_id',
      settingValue: 'rzp_live_T17esLJpmNRSmQ',
      type: 'string'
    },
    create: {
      id: 'd28caef2-bc4e-42ba-86fc-dd372c428a1e',
      settingKey: 'razorpay_live_key_id',
      settingValue: 'rzp_live_T17esLJpmNRSmQ',
      type: 'string'
    },
  });
  await prisma.appSettings.upsert({
    where: { id: '0d00bda1-6285-4563-8fbc-28322287a1ce' },
    update: {
      settingKey: 'razorpay_live_key_secret',
      settingValue: 'YOURSMiQx7v4pQadX5a5LAeQ',
      type: 'string'
    },
    create: {
      id: '0d00bda1-6285-4563-8fbc-28322287a1ce',
      settingKey: 'razorpay_live_key_secret',
      settingValue: 'YOURSMiQx7v4pQadX5a5LAeQ',
      type: 'string'
    },
  });
  await prisma.appSettings.upsert({
    where: { id: '957fdeec-3225-4c12-930d-47abacdc487e' },
    update: {
      settingKey: 'razorpay_mode',
      settingValue: 'test',
      type: 'string'
    },
    create: {
      id: '957fdeec-3225-4c12-930d-47abacdc487e',
      settingKey: 'razorpay_mode',
      settingValue: 'test',
      type: 'string'
    },
  });
  await prisma.appSettings.upsert({
    where: { id: '94676b3d-a2bf-441b-ae4e-c10fb477d072' },
    update: {
      settingKey: 'smtp_host',
      settingValue: '',
      type: 'string'
    },
    create: {
      id: '94676b3d-a2bf-441b-ae4e-c10fb477d072',
      settingKey: 'smtp_host',
      settingValue: '',
      type: 'string'
    },
  });
  await prisma.appSettings.upsert({
    where: { id: '470fcd65-4ca6-4829-beca-45650c3bbb32' },
    update: {
      settingKey: 'smtp_port',
      settingValue: '587',
      type: 'string'
    },
    create: {
      id: '470fcd65-4ca6-4829-beca-45650c3bbb32',
      settingKey: 'smtp_port',
      settingValue: '587',
      type: 'string'
    },
  });
  await prisma.appSettings.upsert({
    where: { id: 'a81be59b-d350-4807-81e7-b88fc0d760d8' },
    update: {
      settingKey: 'smtp_user',
      settingValue: '',
      type: 'string'
    },
    create: {
      id: 'a81be59b-d350-4807-81e7-b88fc0d760d8',
      settingKey: 'smtp_user',
      settingValue: '',
      type: 'string'
    },
  });
  await prisma.appSettings.upsert({
    where: { id: '8ce76109-33d0-46cf-9256-f23fb4a1c1c3' },
    update: {
      settingKey: 'smtp_password',
      settingValue: '',
      type: 'string'
    },
    create: {
      id: '8ce76109-33d0-46cf-9256-f23fb4a1c1c3',
      settingKey: 'smtp_password',
      settingValue: '',
      type: 'string'
    },
  });
  await prisma.appSettings.upsert({
    where: { id: 'e6c7bda0-716e-48da-9c8a-73b8dd4f856c' },
    update: {
      settingKey: 'smtp_sender_name',
      settingValue: 'Growffiy',
      type: 'string'
    },
    create: {
      id: 'e6c7bda0-716e-48da-9c8a-73b8dd4f856c',
      settingKey: 'smtp_sender_name',
      settingValue: 'Growffiy',
      type: 'string'
    },
  });
  await prisma.appSettings.upsert({
    where: { id: '2eb3fc15-3e89-4d13-91e4-842417c3810e' },
    update: {
      settingKey: 'smtp_encryption',
      settingValue: 'tls',
      type: 'string'
    },
    create: {
      id: '2eb3fc15-3e89-4d13-91e4-842417c3810e',
      settingKey: 'smtp_encryption',
      settingValue: 'tls',
      type: 'string'
    },
  });
  await prisma.appSettings.upsert({
    where: { id: '87594b21-70bb-44d5-85df-ca3042dd30e8' },
    update: {
      settingKey: 'smtp_status',
      settingValue: 'false',
      type: 'string'
    },
    create: {
      id: '87594b21-70bb-44d5-85df-ca3042dd30e8',
      settingKey: 'smtp_status',
      settingValue: 'false',
      type: 'string'
    },
  });
  await prisma.appSettings.upsert({
    where: { id: '3c7d6b7f-c7f1-4026-9695-c35e01b9cdb8' },
    update: {
      settingKey: 'support_email',
      settingValue: 'support@growffiy.com',
      type: 'string'
    },
    create: {
      id: '3c7d6b7f-c7f1-4026-9695-c35e01b9cdb8',
      settingKey: 'support_email',
      settingValue: 'support@growffiy.com',
      type: 'string'
    },
  });
  await prisma.appSettings.upsert({
    where: { id: '000cbf6f-4f56-4478-bac4-4dc41385d23b' },
    update: {
      settingKey: 'support_phone',
      settingValue: '+91 9026663052',
      type: 'string'
    },
    create: {
      id: '000cbf6f-4f56-4478-bac4-4dc41385d23b',
      settingKey: 'support_phone',
      settingValue: '+91 9026663052',
      type: 'string'
    },
  });
  await prisma.appSettings.upsert({
    where: { id: '08dd1962-7f47-4a38-bc25-bec4783249b7' },
    update: {
      settingKey: 'support_timings',
      settingValue: 'Live Chat (Mon-Fri, 9:00 AM - 3:30 PM)',
      type: 'string'
    },
    create: {
      id: '08dd1962-7f47-4a38-bc25-bec4783249b7',
      settingKey: 'support_timings',
      settingValue: 'Live Chat (Mon-Fri, 9:00 AM - 3:30 PM)',
      type: 'string'
    },
  });
  await prisma.appSettings.upsert({
    where: { id: '4b9fe07a-a46a-4ba3-b1ee-4635ac483e75' },
    update: {
      settingKey: 'PRE_OPEN_QUOTES_DATA',
      settingValue: '{"quotes":[]}',
      type: 'json'
    },
    create: {
      id: '4b9fe07a-a46a-4ba3-b1ee-4635ac483e75',
      settingKey: 'PRE_OPEN_QUOTES_DATA',
      settingValue: '{"quotes":[]}',
      type: 'json'
    },
  });
  await prisma.appSettings.upsert({
    where: { id: '3813bc5c-1170-4b6c-b7eb-6b27c9947c84' },
    update: {
      settingKey: 'isTradingActive',
      settingValue: 'true',
      type: 'boolean'
    },
    create: {
      id: '3813bc5c-1170-4b6c-b7eb-6b27c9947c84',
      settingKey: 'isTradingActive',
      settingValue: 'true',
      type: 'boolean'
    },
  });
  await prisma.appSettings.upsert({
    where: { id: 'da2a7128-b9d3-4083-ab10-fc86227f748a' },
    update: {
      settingKey: 'algo_preopen_fetch_time',
      settingValue: '09:08',
      type: 'string'
    },
    create: {
      id: 'da2a7128-b9d3-4083-ab10-fc86227f748a',
      settingKey: 'algo_preopen_fetch_time',
      settingValue: '09:08',
      type: 'string'
    },
  });
  await prisma.appSettings.upsert({
    where: { id: '31244e8c-378c-4b9e-b94a-fabd7e1e94e2' },
    update: {
      settingKey: 'algo_entry_time',
      settingValue: '09:20:30',
      type: 'string'
    },
    create: {
      id: '31244e8c-378c-4b9e-b94a-fabd7e1e94e2',
      settingKey: 'algo_entry_time',
      settingValue: '09:20:30',
      type: 'string'
    },
  });
  await prisma.appSettings.upsert({
    where: { id: 'b044cde0-d7f8-4c2a-bc99-a209f8296cda' },
    update: {
      settingKey: 'algo_token_refresh_time',
      settingValue: '08:00',
      type: 'string'
    },
    create: {
      id: 'b044cde0-d7f8-4c2a-bc99-a209f8296cda',
      settingKey: 'algo_token_refresh_time',
      settingValue: '08:00',
      type: 'string'
    },
  });
  await prisma.appSettings.upsert({
    where: { id: '9895f66a-2049-4d51-85f3-2dd78e358c57' },
    update: {
      settingKey: 'algo_check_interval_sec',
      settingValue: '60',
      type: 'string'
    },
    create: {
      id: '9895f66a-2049-4d51-85f3-2dd78e358c57',
      settingKey: 'algo_check_interval_sec',
      settingValue: '60',
      type: 'string'
    },
  });
  await prisma.appSettings.upsert({
    where: { id: '16ded507-6030-478a-8ca6-de6f76348a2a' },
    update: {
      settingKey: 'auto_trade_enabled',
      settingValue: 'true',
      type: 'string'
    },
    create: {
      id: '16ded507-6030-478a-8ca6-de6f76348a2a',
      settingKey: 'auto_trade_enabled',
      settingValue: 'true',
      type: 'string'
    },
  });
  await prisma.appSettings.upsert({
    where: { id: 'c81ddaab-b729-4732-ad24-bd42e50d0ede' },
    update: {
      settingKey: 'trading_days',
      settingValue: '["Mon","Tue","Wed","Thu","Fri"]',
      type: 'string'
    },
    create: {
      id: 'c81ddaab-b729-4732-ad24-bd42e50d0ede',
      settingKey: 'trading_days',
      settingValue: '["Mon","Tue","Wed","Thu","Fri"]',
      type: 'string'
    },
  });
  await prisma.appSettings.upsert({
    where: { id: 'f8cceaea-59a0-47c2-8a77-cf91f569f463' },
    update: {
      settingKey: 'special_market_days',
      settingValue: '[]',
      type: 'string'
    },
    create: {
      id: 'f8cceaea-59a0-47c2-8a77-cf91f569f463',
      settingKey: 'special_market_days',
      settingValue: '[]',
      type: 'string'
    },
  });
  await prisma.appSettings.upsert({
    where: { id: '915db754-9bfd-45ec-a780-776834c8d681' },
    update: {
      settingKey: 'market_holidays',
      settingValue: '[{"date":"2026-06-26","name":"Muharram"}]',
      type: 'string'
    },
    create: {
      id: '915db754-9bfd-45ec-a780-776834c8d681',
      settingKey: 'market_holidays',
      settingValue: '[{"date":"2026-06-26","name":"Muharram"}]',
      type: 'string'
    },
  });
  await prisma.appSettings.upsert({
    where: { id: '3cd6d731-646b-41e0-9b02-eb7d238cea4e' },
    update: {
      settingKey: 'app_name',
      settingValue: 'Growffi',
      type: 'string'
    },
    create: {
      id: '3cd6d731-646b-41e0-9b02-eb7d238cea4e',
      settingKey: 'app_name',
      settingValue: 'Growffi',
      type: 'string'
    },
  });
  await prisma.appSettings.upsert({
    where: { id: '0daab40f-3239-432d-8d3c-0388fd7062f4' },
    update: {
      settingKey: 'app_title',
      settingValue: 'Growffiy — ',
      type: 'string'
    },
    create: {
      id: '0daab40f-3239-432d-8d3c-0388fd7062f4',
      settingKey: 'app_title',
      settingValue: 'Growffiy — ',
      type: 'string'
    },
  });
  await prisma.appSettings.upsert({
    where: { id: '248a11d6-03e0-4982-81e9-6ba91f59ba6c' },
    update: {
      settingKey: 'app_favicon',
      settingValue: '',
      type: 'string'
    },
    create: {
      id: '248a11d6-03e0-4982-81e9-6ba91f59ba6c',
      settingKey: 'app_favicon',
      settingValue: '',
      type: 'string'
    },
  });
  await prisma.appSettings.upsert({
    where: { id: '2e8ea13a-bd1b-4439-b744-aa4fa56091c0' },
    update: {
      settingKey: 'app_logo',
      settingValue: '',
      type: 'string'
    },
    create: {
      id: '2e8ea13a-bd1b-4439-b744-aa4fa56091c0',
      settingKey: 'app_logo',
      settingValue: '',
      type: 'string'
    },
  });
  await prisma.appSettings.upsert({
    where: { id: 'bbf12f03-e575-42a6-ac18-f398aa63c110' },
    update: {
      settingKey: 'meta_description',
      settingValue: 'afldhf',
      type: 'string'
    },
    create: {
      id: 'bbf12f03-e575-42a6-ac18-f398aa63c110',
      settingKey: 'meta_description',
      settingValue: 'afldhf',
      type: 'string'
    },
  });
  await prisma.appSettings.upsert({
    where: { id: '0b353118-0eec-4cdc-ab32-1a401169a7cf' },
    update: {
      settingKey: 'meta_keywords',
      settingValue: 'dfla',
      type: 'string'
    },
    create: {
      id: '0b353118-0eec-4cdc-ab32-1a401169a7cf',
      settingKey: 'meta_keywords',
      settingValue: 'dfla',
      type: 'string'
    },
  });
  await prisma.appSettings.upsert({
    where: { id: '7cfe80b5-de1e-4248-86ee-5c1c5159fa75' },
    update: {
      settingKey: 'footer_text',
      settingValue: 'fdflahf',
      type: 'string'
    },
    create: {
      id: '7cfe80b5-de1e-4248-86ee-5c1c5159fa75',
      settingKey: 'footer_text',
      settingValue: 'fdflahf',
      type: 'string'
    },
  });
  await prisma.appSettings.upsert({
    where: { id: 'd0c1cd6c-43b0-4e00-8564-e273e339d67b' },
    update: {
      settingKey: 'google_analytics_id',
      settingValue: 'fdajf',
      type: 'string'
    },
    create: {
      id: 'd0c1cd6c-43b0-4e00-8564-e273e339d67b',
      settingKey: 'google_analytics_id',
      settingValue: 'fdajf',
      type: 'string'
    },
  });
  console.log('appSettings: 33');


  // ──────────────────────────────────────────────
  // 9. Support Tickets
  // ──────────────────────────────────────────────
  await prisma.supportTicket.upsert({
    where: { id: '514dff3f-be17-4fec-9b32-b288988fb105' },
    update: {
      userId: '846d4c97-be94-4a06-a72c-c048daf71e3c',
      subject: 'hfkh',
      message: 'dfaldhf',
      category: 'General',
      status: 'resolved',
      reply: null
    },
    create: {
      id: '514dff3f-be17-4fec-9b32-b288988fb105',
      userId: '846d4c97-be94-4a06-a72c-c048daf71e3c',
      subject: 'hfkh',
      message: 'dfaldhf',
      category: 'General',
      status: 'resolved',
      reply: null
    },
  });
  console.log('supportTicket: 1');


  // ──────────────────────────────────────────────
  // 10. Strategy Assignments
  // ──────────────────────────────────────────────
  await prisma.strategyAssignment.upsert({
    where: { id: '6b5595d6-7181-4b8d-9d88-f61563603bb6' },
    update: {
      clientId: 'b364d72f-e2e2-4dbc-bbef-3286c75e1875',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      status: 'active'
    },
    create: {
      id: '6b5595d6-7181-4b8d-9d88-f61563603bb6',
      clientId: 'b364d72f-e2e2-4dbc-bbef-3286c75e1875',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      status: 'active'
    },
  });
  await prisma.strategyAssignment.upsert({
    where: { id: '81977e6e-88cb-4f5a-a0cc-96fb67673a25' },
    update: {
      clientId: 'b364d72f-e2e2-4dbc-bbef-3286c75e1875',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      status: 'active'
    },
    create: {
      id: '81977e6e-88cb-4f5a-a0cc-96fb67673a25',
      clientId: 'b364d72f-e2e2-4dbc-bbef-3286c75e1875',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      status: 'active'
    },
  });
  await prisma.strategyAssignment.upsert({
    where: { id: 'efbd6895-f105-41c1-81f2-6cd1f06f557a' },
    update: {
      clientId: 'b364d72f-e2e2-4dbc-bbef-3286c75e1875',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      status: 'active'
    },
    create: {
      id: 'efbd6895-f105-41c1-81f2-6cd1f06f557a',
      clientId: 'b364d72f-e2e2-4dbc-bbef-3286c75e1875',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      status: 'active'
    },
  });
  console.log('strategyAssignment: 3');


  // ──────────────────────────────────────────────
  // 11. Strategy Logs
  // ──────────────────────────────────────────────
  await prisma.strategyLog.upsert({
    where: { id: '12c48757-969a-434f-acea-021e3bbca268' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-16T14:10:57.437Z')
    },
    create: {
      id: '12c48757-969a-434f-acea-021e3bbca268',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-16T14:10:57.437Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'cdfdec00-963b-4162-babb-9f0f81b92d7d' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Client b364d72f-e2e2-4dbc-bbef-3286c75e1875 assigned to strategy.',
      logType: 'info',
      createdAt: new Date('2026-06-16T18:20:03.110Z')
    },
    create: {
      id: 'cdfdec00-963b-4162-babb-9f0f81b92d7d',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Client b364d72f-e2e2-4dbc-bbef-3286c75e1875 assigned to strategy.',
      logType: 'info',
      createdAt: new Date('2026-06-16T18:20:03.110Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'e1c62193-bd8d-4f66-9f61-90353acbc3d0' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Client b364d72f-e2e2-4dbc-bbef-3286c75e1875 assigned to strategy.',
      logType: 'info',
      createdAt: new Date('2026-06-16T18:20:10.582Z')
    },
    create: {
      id: 'e1c62193-bd8d-4f66-9f61-90353acbc3d0',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Client b364d72f-e2e2-4dbc-bbef-3286c75e1875 assigned to strategy.',
      logType: 'info',
      createdAt: new Date('2026-06-16T18:20:10.582Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '008ee260-460b-4d60-88d4-f495e8f4ef1e' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Client b364d72f-e2e2-4dbc-bbef-3286c75e1875 assigned to strategy.',
      logType: 'info',
      createdAt: new Date('2026-06-16T18:20:15.192Z')
    },
    create: {
      id: '008ee260-460b-4d60-88d4-f495e8f4ef1e',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Client b364d72f-e2e2-4dbc-bbef-3286c75e1875 assigned to strategy.',
      logType: 'info',
      createdAt: new Date('2026-06-16T18:20:15.192Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '5da24d33-dc1d-4a08-a9b9-8de062b513f6' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Intraday Trade Initiated for Vikash sharma: Bought 1 shares of VAML at entry price ₹471.11 using config from DB strategy "Pre Open Momentum Breakout". Capital allocated (1%): ₹500.00. Target: ₹478.18 (1.5%), Stop Loss: ₹468.75 (0.5%).',
      logType: 'trade',
      createdAt: new Date('2026-06-16T18:31:47.437Z')
    },
    create: {
      id: '5da24d33-dc1d-4a08-a9b9-8de062b513f6',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Intraday Trade Initiated for Vikash sharma: Bought 1 shares of VAML at entry price ₹471.11 using config from DB strategy "Pre Open Momentum Breakout". Capital allocated (1%): ₹500.00. Target: ₹478.18 (1.5%), Stop Loss: ₹468.75 (0.5%).',
      logType: 'trade',
      createdAt: new Date('2026-06-16T18:31:47.437Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '988b766f-06b3-43dc-8c81-3a2823d66e17' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: Zerodha API returned error status. Trade aborted.',
      logType: 'error',
      createdAt: new Date('2026-06-16T18:39:19.598Z')
    },
    create: {
      id: '988b766f-06b3-43dc-8c81-3a2823d66e17',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: Zerodha API returned error status. Trade aborted.',
      logType: 'error',
      createdAt: new Date('2026-06-16T18:39:19.598Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '481c5d9a-edff-4043-abbc-150652efdec1' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: Zerodha API returned error status. Trade aborted.',
      logType: 'error',
      createdAt: new Date('2026-06-16T18:48:33.941Z')
    },
    create: {
      id: '481c5d9a-edff-4043-abbc-150652efdec1',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: Zerodha API returned error status. Trade aborted.',
      logType: 'error',
      createdAt: new Date('2026-06-16T18:48:33.941Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'c330337b-2647-40ef-9113-a700ea565bfc' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: Zerodha API returned error status. Trade aborted.',
      logType: 'error',
      createdAt: new Date('2026-06-16T19:46:36.841Z')
    },
    create: {
      id: 'c330337b-2647-40ef-9113-a700ea565bfc',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: Zerodha API returned error status. Trade aborted.',
      logType: 'error',
      createdAt: new Date('2026-06-16T19:46:36.841Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '7ebf171e-4f99-45b2-be88-f5625d0b41da' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: IP (3.86.244.195) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip',
      logType: 'error',
      createdAt: new Date('2026-06-16T19:56:23.220Z')
    },
    create: {
      id: '7ebf171e-4f99-45b2-be88-f5625d0b41da',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: IP (3.86.244.195) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip',
      logType: 'error',
      createdAt: new Date('2026-06-16T19:56:23.220Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '8b6628ab-5cb7-40b0-aa38-4dc495a8c573' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: IP (100.26.48.193) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip',
      logType: 'error',
      createdAt: new Date('2026-06-16T19:57:36.308Z')
    },
    create: {
      id: '8b6628ab-5cb7-40b0-aa38-4dc495a8c573',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: IP (100.26.48.193) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip',
      logType: 'error',
      createdAt: new Date('2026-06-16T19:57:36.308Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '43f15089-10fb-4939-9836-50e84193b980' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: IP (44.192.70.209) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip',
      logType: 'error',
      createdAt: new Date('2026-06-16T19:59:03.339Z')
    },
    create: {
      id: '43f15089-10fb-4939-9836-50e84193b980',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: IP (44.192.70.209) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip',
      logType: 'error',
      createdAt: new Date('2026-06-16T19:59:03.339Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '529b6384-6f29-444f-949b-e38ad86475cf' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: IP (100.58.222.232) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip',
      logType: 'error',
      createdAt: new Date('2026-06-17T19:41:35.122Z')
    },
    create: {
      id: '529b6384-6f29-444f-949b-e38ad86475cf',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: IP (100.58.222.232) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip',
      logType: 'error',
      createdAt: new Date('2026-06-17T19:41:35.122Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '6c723938-8fc0-4387-a4c3-bc1ebcbb425f' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: IP (32.192.52.0) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip',
      logType: 'error',
      createdAt: new Date('2026-06-17T19:44:30.100Z')
    },
    create: {
      id: '6c723938-8fc0-4387-a4c3-bc1ebcbb425f',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: IP (32.192.52.0) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip',
      logType: 'error',
      createdAt: new Date('2026-06-17T19:44:30.100Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'f8653bb3-b34c-4a84-8353-13521ae1282a' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: IP (23.20.22.105) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip',
      logType: 'error',
      createdAt: new Date('2026-06-17T20:02:42.736Z')
    },
    create: {
      id: 'f8653bb3-b34c-4a84-8353-13521ae1282a',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: IP (23.20.22.105) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip',
      logType: 'error',
      createdAt: new Date('2026-06-17T20:02:42.736Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '3559e1dd-45fb-4327-9f3e-26ffd58ad39f' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: IP (44.203.201.11) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip',
      logType: 'error',
      createdAt: new Date('2026-06-17T20:07:14.338Z')
    },
    create: {
      id: '3559e1dd-45fb-4327-9f3e-26ffd58ad39f',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: IP (44.203.201.11) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip',
      logType: 'error',
      createdAt: new Date('2026-06-17T20:07:14.338Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'c209a0bb-77c6-4316-be1d-ab073e974d42' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: IP (54.209.77.35) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip',
      logType: 'error',
      createdAt: new Date('2026-06-17T20:13:44.201Z')
    },
    create: {
      id: 'c209a0bb-77c6-4316-be1d-ab073e974d42',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: IP (54.209.77.35) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip',
      logType: 'error',
      createdAt: new Date('2026-06-17T20:13:44.201Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '04800d18-3f4f-45de-9cf9-1bf5ef0b01ec' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: Market orders without market protection are not allowed via API. Please set market protection or use a Limit order.',
      logType: 'error',
      createdAt: new Date('2026-06-17T20:29:25.094Z')
    },
    create: {
      id: '04800d18-3f4f-45de-9cf9-1bf5ef0b01ec',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: Market orders without market protection are not allowed via API. Please set market protection or use a Limit order.',
      logType: 'error',
      createdAt: new Date('2026-06-17T20:29:25.094Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '0a5f7ce8-1924-41db-912c-66ca728c6878' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: Market orders without market protection are not allowed via API. Please set market protection or use a Limit order.',
      logType: 'error',
      createdAt: new Date('2026-06-17T20:36:07.261Z')
    },
    create: {
      id: '0a5f7ce8-1924-41db-912c-66ca728c6878',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: Market orders without market protection are not allowed via API. Please set market protection or use a Limit order.',
      logType: 'error',
      createdAt: new Date('2026-06-17T20:36:07.261Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '1dc986a7-adfd-46b2-b4ab-efe1f4d6657b' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: Market orders without market protection are not allowed via API. Please set market protection or use a Limit order.',
      logType: 'error',
      createdAt: new Date('2026-06-17T20:41:59.316Z')
    },
    create: {
      id: '1dc986a7-adfd-46b2-b4ab-efe1f4d6657b',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: Market orders without market protection are not allowed via API. Please set market protection or use a Limit order.',
      logType: 'error',
      createdAt: new Date('2026-06-17T20:41:59.316Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '4960f39f-c821-49fc-bd70-9dd67f122b6f' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: Market orders without market protection are not allowed via API. Please set market protection or use a Limit order.',
      logType: 'error',
      createdAt: new Date('2026-06-17T20:45:26.815Z')
    },
    create: {
      id: '4960f39f-c821-49fc-bd70-9dd67f122b6f',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: Market orders without market protection are not allowed via API. Please set market protection or use a Limit order.',
      logType: 'error',
      createdAt: new Date('2026-06-17T20:45:26.815Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '4eac0c0e-69d0-4cd7-b172-1ae3578ea496' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: Market orders without market protection are not allowed via API. Please set market protection or use a Limit order.',
      logType: 'error',
      createdAt: new Date('2026-06-17T20:46:06.198Z')
    },
    create: {
      id: '4eac0c0e-69d0-4cd7-b172-1ae3578ea496',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: Market orders without market protection are not allowed via API. Please set market protection or use a Limit order.',
      logType: 'error',
      createdAt: new Date('2026-06-17T20:46:06.198Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '305ebca1-49f0-41cf-bfc6-0935ddb000b4' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: Market orders without market protection are not allowed via API. Please set market protection or use a Limit order.',
      logType: 'error',
      createdAt: new Date('2026-06-17T20:48:11.575Z')
    },
    create: {
      id: '305ebca1-49f0-41cf-bfc6-0935ddb000b4',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: Market orders without market protection are not allowed via API. Please set market protection or use a Limit order.',
      logType: 'error',
      createdAt: new Date('2026-06-17T20:48:11.575Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '59c5e527-453d-4ee3-99f3-bf0d098e9efd' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: Your order could not be converted to a After Market Order (AMO).',
      logType: 'error',
      createdAt: new Date('2026-06-17T21:01:51.354Z')
    },
    create: {
      id: '59c5e527-453d-4ee3-99f3-bf0d098e9efd',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: Your order could not be converted to a After Market Order (AMO).',
      logType: 'error',
      createdAt: new Date('2026-06-17T21:01:51.354Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '94a603f1-8e84-4d8f-b764-dc557ee6cc21' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: IP (2405:201:6011:f874:1968:4b6e:d659:3398) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip',
      logType: 'error',
      createdAt: new Date('2026-06-17T21:04:58.590Z')
    },
    create: {
      id: '94a603f1-8e84-4d8f-b764-dc557ee6cc21',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: IP (2405:201:6011:f874:1968:4b6e:d659:3398) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip',
      logType: 'error',
      createdAt: new Date('2026-06-17T21:04:58.590Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'f4aa2e90-160e-45f2-b69b-c35068eb5de1' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: IP (2405:201:6011:f874:1968:4b6e:d659:3398) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip',
      logType: 'error',
      createdAt: new Date('2026-06-17T21:12:43.318Z')
    },
    create: {
      id: 'f4aa2e90-160e-45f2-b69b-c35068eb5de1',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: IP (2405:201:6011:f874:1968:4b6e:d659:3398) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip',
      logType: 'error',
      createdAt: new Date('2026-06-17T21:12:43.318Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '30babe18-dc8e-422a-a366-e051dd3b6cf5' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: Our order management system is under scheduled maintenance. Try placing your AMO order after 5.30 AM.',
      logType: 'error',
      createdAt: new Date('2026-06-17T21:21:36.563Z')
    },
    create: {
      id: '30babe18-dc8e-422a-a366-e051dd3b6cf5',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: Our order management system is under scheduled maintenance. Try placing your AMO order after 5.30 AM.',
      logType: 'error',
      createdAt: new Date('2026-06-17T21:21:36.563Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '5203d466-3beb-4374-bfc5-8cfd65dad5cc' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: Incorrect `api_key` or `access_token`.',
      logType: 'error',
      createdAt: new Date('2026-06-18T03:45:45.229Z')
    },
    create: {
      id: '5203d466-3beb-4374-bfc5-8cfd65dad5cc',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: Incorrect `api_key` or `access_token`.',
      logType: 'error',
      createdAt: new Date('2026-06-18T03:45:45.229Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '7e99e852-830a-4a6e-9d84-67248c5ebccf' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-18T19:12:35.991Z')
    },
    create: {
      id: '7e99e852-830a-4a6e-9d84-67248c5ebccf',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-18T19:12:35.991Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '5e1b3e4d-f779-435f-82e5-18c4d2697bc4' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-18T19:13:00.811Z')
    },
    create: {
      id: '5e1b3e4d-f779-435f-82e5-18c4d2697bc4',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-18T19:13:00.811Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '7939411b-056c-4843-ac8e-752a6a1ec784' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Skipped: Calculated quantity is 0 (Allocated amount ₹854.90 is less than entry price ₹3040.24).',
      logType: 'info',
      createdAt: new Date('2026-06-19T03:50:43.412Z')
    },
    create: {
      id: '7939411b-056c-4843-ac8e-752a6a1ec784',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Skipped: Calculated quantity is 0 (Allocated amount ₹854.90 is less than entry price ₹3040.24).',
      logType: 'info',
      createdAt: new Date('2026-06-19T03:50:43.412Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'e13d818c-ee07-4ed0-a295-c2c5869ba736' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-19T16:19:08.859Z')
    },
    create: {
      id: 'e13d818c-ee07-4ed0-a295-c2c5869ba736',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-19T16:19:08.859Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '30a009c0-0609-41f6-a52e-dbe70dc53c65' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-19T18:17:21.512Z')
    },
    create: {
      id: '30a009c0-0609-41f6-a52e-dbe70dc53c65',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-19T18:17:21.512Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'ec6dcb76-db19-4b38-bf7b-3dd3b0a5875a' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-19T20:17:46.863Z')
    },
    create: {
      id: 'ec6dcb76-db19-4b38-bf7b-3dd3b0a5875a',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-19T20:17:46.863Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'e67e27e7-7c76-4ff8-8e6f-a2f1810adae2' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Client b364d72f-e2e2-4dbc-bbef-3286c75e1875 assigned to strategy.',
      logType: 'info',
      createdAt: new Date('2026-06-21T20:39:30.483Z')
    },
    create: {
      id: 'e67e27e7-7c76-4ff8-8e6f-a2f1810adae2',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Client b364d72f-e2e2-4dbc-bbef-3286c75e1875 assigned to strategy.',
      logType: 'info',
      createdAt: new Date('2026-06-21T20:39:30.483Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '16519ddd-3431-49c9-aa87-c082da7b5ba2' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Client b364d72f-e2e2-4dbc-bbef-3286c75e1875 assigned to strategy.',
      logType: 'info',
      createdAt: new Date('2026-06-21T20:39:31.551Z')
    },
    create: {
      id: '16519ddd-3431-49c9-aa87-c082da7b5ba2',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Client b364d72f-e2e2-4dbc-bbef-3286c75e1875 assigned to strategy.',
      logType: 'info',
      createdAt: new Date('2026-06-21T20:39:31.551Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '3f77afcb-3964-483a-a9a3-32d79538aade' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-22T02:19:04.457Z')
    },
    create: {
      id: '3f77afcb-3964-483a-a9a3-32d79538aade',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-22T02:19:04.457Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'c8c7ab31-8109-4c93-b026-babc7e924574' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-22T06:47:11.276Z')
    },
    create: {
      id: 'c8c7ab31-8109-4c93-b026-babc7e924574',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-22T06:47:11.276Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '3d169060-38ee-4751-bcb3-085acba50c9d' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-22T07:01:22.500Z')
    },
    create: {
      id: '3d169060-38ee-4751-bcb3-085acba50c9d',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-22T07:01:22.500Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '98d19fdc-9237-49a4-a0cd-6645cc469314' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: Tick size for this script is 0.50. Kindly enter trigger price in the multiple of tick size for this script',
      logType: 'error',
      createdAt: new Date('2026-06-22T07:04:23.857Z')
    },
    create: {
      id: '98d19fdc-9237-49a4-a0cd-6645cc469314',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: Tick size for this script is 0.50. Kindly enter trigger price in the multiple of tick size for this script',
      logType: 'error',
      createdAt: new Date('2026-06-22T07:04:23.857Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'e9f35025-a9fd-4db9-801d-a330ec314b87' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-22T14:47:13.370Z')
    },
    create: {
      id: 'e9f35025-a9fd-4db9-801d-a330ec314b87',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-22T14:47:13.370Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'b1a71d09-308a-46e4-a36f-0cf8475aaacf' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-22T14:47:31.275Z')
    },
    create: {
      id: 'b1a71d09-308a-46e4-a36f-0cf8475aaacf',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-22T14:47:31.275Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '555c620c-89f4-4861-a344-c3a949d1f27c' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-22T14:48:15.991Z')
    },
    create: {
      id: '555c620c-89f4-4861-a344-c3a949d1f27c',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-22T14:48:15.991Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'dc88069c-2ba1-425e-9be8-ac5cc7be7436' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-22T14:48:33.605Z')
    },
    create: {
      id: 'dc88069c-2ba1-425e-9be8-ac5cc7be7436',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-22T14:48:33.605Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '0d0f9615-b2ae-43bb-8ca7-aea559e2330f' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-23T07:32:15.475Z')
    },
    create: {
      id: '0d0f9615-b2ae-43bb-8ca7-aea559e2330f',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-23T07:32:15.475Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '1276bbd1-b6b7-4ae2-a35e-fe12f99bdfe0' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: Trigger price for stoploss buy orders cannot be above the upper circuit price. Please try placing the order with trigger price below 336.40. [Read more.](https://support.zerodha.com/category/trading-and-markets/margin-leverage-and-product-and-order-types/articles/what-are-stop-loss-orders-and-how-to-use-them)',
      logType: 'error',
      createdAt: new Date('2026-06-23T08:44:07.628Z')
    },
    create: {
      id: '1276bbd1-b6b7-4ae2-a35e-fe12f99bdfe0',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Kite order failed for Vikash sharma: Trigger price for stoploss buy orders cannot be above the upper circuit price. Please try placing the order with trigger price below 336.40. [Read more.](https://support.zerodha.com/category/trading-and-markets/margin-leverage-and-product-and-order-types/articles/what-are-stop-loss-orders-and-how-to-use-them)',
      logType: 'error',
      createdAt: new Date('2026-06-23T08:44:07.628Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '0cabfaa8-baea-40ac-8004-ad0180fb6e60' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-23T08:45:23.335Z')
    },
    create: {
      id: '0cabfaa8-baea-40ac-8004-ad0180fb6e60',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-23T08:45:23.335Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '68662a34-83ec-4921-bf8a-ad2d21191e6d' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-23T08:58:50.389Z')
    },
    create: {
      id: '68662a34-83ec-4921-bf8a-ad2d21191e6d',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-23T08:58:50.389Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '4a5d342d-4ab3-4cdf-aaa6-4ffe5c0cf122' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-23T09:03:20.232Z')
    },
    create: {
      id: '4a5d342d-4ab3-4cdf-aaa6-4ffe5c0cf122',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-23T09:03:20.232Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '9c9c9c9b-4b7d-47bc-9434-d8fd5f9fbb29' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-23T09:08:33.191Z')
    },
    create: {
      id: '9c9c9c9b-4b7d-47bc-9434-d8fd5f9fbb29',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-23T09:08:33.191Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '427ff935-9d5e-4093-945b-1e29a67a76d9' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Intraday Trade Initiated for Vikash sharma: Bought 119 shares of VEDL at entry price ₹294.80 using config from DB strategy "Pre-Open Momentum Breakout". Capital at risk: ₹353.75. Target: ₹300.69 (2%), Stop Loss: ₹291.85 (1%). Entry Order: 260623171672769, SL Order: N/A, Target Order: N/A',
      logType: 'trade',
      createdAt: new Date('2026-06-23T09:09:15.314Z')
    },
    create: {
      id: '427ff935-9d5e-4093-945b-1e29a67a76d9',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Intraday Trade Initiated for Vikash sharma: Bought 119 shares of VEDL at entry price ₹294.80 using config from DB strategy "Pre-Open Momentum Breakout". Capital at risk: ₹353.75. Target: ₹300.69 (2%), Stop Loss: ₹291.85 (1%). Entry Order: 260623171672769, SL Order: N/A, Target Order: N/A',
      logType: 'trade',
      createdAt: new Date('2026-06-23T09:09:15.314Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'caf91697-3ab4-46a1-aa21-e76565d4a887' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Intraday Trade Initiated for Vikash sharma: Bought 119 shares of VEDL at entry price ₹294.80 using config from DB strategy "Pre-Open Momentum Breakout". Capital at risk: ₹353.75. Target: ₹300.69 (2%), Stop Loss: ₹291.85 (1%). Entry Order: 260623171672869, SL Order: N/A, Target Order: N/A',
      logType: 'trade',
      createdAt: new Date('2026-06-23T09:09:17.070Z')
    },
    create: {
      id: 'caf91697-3ab4-46a1-aa21-e76565d4a887',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Intraday Trade Initiated for Vikash sharma: Bought 119 shares of VEDL at entry price ₹294.80 using config from DB strategy "Pre-Open Momentum Breakout". Capital at risk: ₹353.75. Target: ₹300.69 (2%), Stop Loss: ₹291.85 (1%). Entry Order: 260623171672869, SL Order: N/A, Target Order: N/A',
      logType: 'trade',
      createdAt: new Date('2026-06-23T09:09:17.070Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'dd8f9f92-6ca8-489a-8453-8bbd336c4228' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Intraday Trade Initiated for Vikash sharma: Bought 119 shares of VEDL at entry price ₹294.80 using config from DB strategy "Pre-Open Momentum Breakout". Capital at risk: ₹353.75. Target: ₹300.69 (2%), Stop Loss: ₹291.85 (1%). Entry Order: 260623171672934, SL Order: N/A, Target Order: N/A',
      logType: 'trade',
      createdAt: new Date('2026-06-23T09:09:17.415Z')
    },
    create: {
      id: 'dd8f9f92-6ca8-489a-8453-8bbd336c4228',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Intraday Trade Initiated for Vikash sharma: Bought 119 shares of VEDL at entry price ₹294.80 using config from DB strategy "Pre-Open Momentum Breakout". Capital at risk: ₹353.75. Target: ₹300.69 (2%), Stop Loss: ₹291.85 (1%). Entry Order: 260623171672934, SL Order: N/A, Target Order: N/A',
      logType: 'trade',
      createdAt: new Date('2026-06-23T09:09:17.415Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '0bc50890-e986-4336-a00c-6d5fcf689967' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:55:11.250Z')
    },
    create: {
      id: '0bc50890-e986-4336-a00c-6d5fcf689967',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:55:11.250Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'bc1d1728-aec4-4302-ac3e-cbf6350d7dd8' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:55:16.387Z')
    },
    create: {
      id: 'bc1d1728-aec4-4302-ac3e-cbf6350d7dd8',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:55:16.387Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '10a0ad89-33c5-4d8b-8bd7-130855909661' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:55:16.402Z')
    },
    create: {
      id: '10a0ad89-33c5-4d8b-8bd7-130855909661',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:55:16.402Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '66680a83-bfd7-407e-b498-c4eb466c341f' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:55:22.083Z')
    },
    create: {
      id: '66680a83-bfd7-407e-b498-c4eb466c341f',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:55:22.083Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '3be527b2-e2e7-460d-ae06-4ded5f3003b0' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:55:30.527Z')
    },
    create: {
      id: '3be527b2-e2e7-460d-ae06-4ded5f3003b0',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:55:30.527Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '46746aca-47ee-4af9-a50f-ddba3beca77b' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:55:49.593Z')
    },
    create: {
      id: '46746aca-47ee-4af9-a50f-ddba3beca77b',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:55:49.593Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '610c4d0d-7f38-4436-b896-3c108db8d5fe' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:56:02.038Z')
    },
    create: {
      id: '610c4d0d-7f38-4436-b896-3c108db8d5fe',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:56:02.038Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '0b1ab2a0-eda9-43f1-846c-d7a87a7cde5a' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:56:03.651Z')
    },
    create: {
      id: '0b1ab2a0-eda9-43f1-846c-d7a87a7cde5a',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:56:03.651Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'a7f9a00a-71d3-4d13-ba0a-f595162fbf5b' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:56:21.399Z')
    },
    create: {
      id: 'a7f9a00a-71d3-4d13-ba0a-f595162fbf5b',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:56:21.399Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'af880a44-cd06-4f36-8f12-af45dbd997cc' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:56:26.386Z')
    },
    create: {
      id: 'af880a44-cd06-4f36-8f12-af45dbd997cc',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:56:26.386Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '9dce9d5d-d484-406d-b0cb-a34f4a278f3a' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:56:26.400Z')
    },
    create: {
      id: '9dce9d5d-d484-406d-b0cb-a34f4a278f3a',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:56:26.400Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '66093efa-9bdb-4e07-b209-803e23aef027' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:56:32.100Z')
    },
    create: {
      id: '66093efa-9bdb-4e07-b209-803e23aef027',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:56:32.100Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '019367f2-3bed-458a-9964-9213cda18e90' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:56:40.456Z')
    },
    create: {
      id: '019367f2-3bed-458a-9964-9213cda18e90',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:56:40.456Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'f4828ede-185e-4e25-946e-80ad578342b7' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:56:59.554Z')
    },
    create: {
      id: 'f4828ede-185e-4e25-946e-80ad578342b7',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:56:59.554Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'd406ee8b-6bb0-4636-86ff-ec5ebd249587' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:57:05.040Z')
    },
    create: {
      id: 'd406ee8b-6bb0-4636-86ff-ec5ebd249587',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:57:05.040Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '290402ee-a8c7-49b9-8162-dd987fe6b34a' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:57:12.880Z')
    },
    create: {
      id: '290402ee-a8c7-49b9-8162-dd987fe6b34a',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:57:12.880Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'bdbca56c-8714-4549-8d1b-278ee9c5f7c6' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:57:21.441Z')
    },
    create: {
      id: 'bdbca56c-8714-4549-8d1b-278ee9c5f7c6',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:57:21.441Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'b7c8aa30-7f73-42ed-ab37-a8a405febf78' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:57:26.629Z')
    },
    create: {
      id: 'b7c8aa30-7f73-42ed-ab37-a8a405febf78',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:57:26.629Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '13efbf5f-8950-417e-8cbd-54f379f1fdf7' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:57:32.064Z')
    },
    create: {
      id: '13efbf5f-8950-417e-8cbd-54f379f1fdf7',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:57:32.064Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'cd509e41-5882-480b-a8aa-ab76811d54ab' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:57:37.357Z')
    },
    create: {
      id: 'cd509e41-5882-480b-a8aa-ab76811d54ab',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:57:37.357Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'ce038153-e48d-46c4-9be6-e05a9b49b31f' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:57:59.604Z')
    },
    create: {
      id: 'ce038153-e48d-46c4-9be6-e05a9b49b31f',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:57:59.604Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '9e5b7591-8080-498f-9960-5c3eda9f9ed2' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:58:21.582Z')
    },
    create: {
      id: '9e5b7591-8080-498f-9960-5c3eda9f9ed2',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:58:21.582Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'cf684c68-a332-45c5-b6a1-cf2c444a3bd1' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:58:27.623Z')
    },
    create: {
      id: 'cf684c68-a332-45c5-b6a1-cf2c444a3bd1',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:58:27.623Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '637b2031-ad55-4749-a045-22221be2cf11' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:58:31.434Z')
    },
    create: {
      id: '637b2031-ad55-4749-a045-22221be2cf11',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:58:31.434Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '3e7b8a15-8f2d-4e7a-be69-8d200d8f7e7d' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:59:09.572Z')
    },
    create: {
      id: '3e7b8a15-8f2d-4e7a-be69-8d200d8f7e7d',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:59:09.572Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '82ea2270-05f4-414a-8581-946803af65b3' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:59:31.551Z')
    },
    create: {
      id: '82ea2270-05f4-414a-8581-946803af65b3',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:59:31.551Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '9bead5c8-1b65-41c0-9aa0-432dd83fc84f' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:59:41.217Z')
    },
    create: {
      id: '9bead5c8-1b65-41c0-9aa0-432dd83fc84f',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T09:59:41.217Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'c70be312-1f7a-478b-a380-18857f2ec60d' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:00:09.585Z')
    },
    create: {
      id: 'c70be312-1f7a-478b-a380-18857f2ec60d',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:00:09.585Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '898aa4e9-2627-435a-9358-72ea0ed9984b' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:00:31.602Z')
    },
    create: {
      id: '898aa4e9-2627-435a-9358-72ea0ed9984b',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:00:31.602Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '2e963c1d-25dd-4b4b-a32f-d9543bf52d57' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:00:51.221Z')
    },
    create: {
      id: '2e963c1d-25dd-4b4b-a32f-d9543bf52d57',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:00:51.221Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '68f9b0af-c2ba-4c8b-a478-10740759c8a4' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:01:09.633Z')
    },
    create: {
      id: '68f9b0af-c2ba-4c8b-a478-10740759c8a4',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:01:09.633Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '95f45563-fcac-4ca5-a56f-1a5606b1e9a1' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:01:41.588Z')
    },
    create: {
      id: '95f45563-fcac-4ca5-a56f-1a5606b1e9a1',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:01:41.588Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'f43e677a-1276-4c80-82a8-bbe30cefbc21' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:02:01.198Z')
    },
    create: {
      id: 'f43e677a-1276-4c80-82a8-bbe30cefbc21',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:02:01.198Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '7d863fb9-6953-413a-bc9d-bb159a685a38' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:02:19.599Z')
    },
    create: {
      id: '7d863fb9-6953-413a-bc9d-bb159a685a38',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:02:19.599Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'ca1cffe4-6ff7-4d00-9042-5c34ec3bc835' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:02:51.588Z')
    },
    create: {
      id: 'ca1cffe4-6ff7-4d00-9042-5c34ec3bc835',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:02:51.588Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'c9b2a4e7-5e04-4509-bcc4-d6869ce09dba' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:03:11.198Z')
    },
    create: {
      id: 'c9b2a4e7-5e04-4509-bcc4-d6869ce09dba',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:03:11.198Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'f301572c-ce31-4487-87ba-2d5fe55fc5d7' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:03:29.659Z')
    },
    create: {
      id: 'f301572c-ce31-4487-87ba-2d5fe55fc5d7',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:03:29.659Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'c9967113-7cf3-4a2b-8fbf-1916e0dc0f8f' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:03:51.585Z')
    },
    create: {
      id: 'c9967113-7cf3-4a2b-8fbf-1916e0dc0f8f',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:03:51.585Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'a2f17088-1071-4a94-a06e-932ee30d114c' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:04:11.219Z')
    },
    create: {
      id: 'a2f17088-1071-4a94-a06e-932ee30d114c',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:04:11.219Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'd13e7045-ccfc-4cea-aa00-a39c539f2ce0' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:04:29.623Z')
    },
    create: {
      id: 'd13e7045-ccfc-4cea-aa00-a39c539f2ce0',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:04:29.623Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '70cf65c4-d724-416b-ac8c-8efcbbb4ef62' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:04:51.614Z')
    },
    create: {
      id: '70cf65c4-d724-416b-ac8c-8efcbbb4ef62',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:04:51.614Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'c84e6e46-ad3b-425f-9068-4b90e0592388' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:05:11.261Z')
    },
    create: {
      id: 'c84e6e46-ad3b-425f-9068-4b90e0592388',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:05:11.261Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '4bfc9a9d-4113-426f-b744-f2ddbf49b73f' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:05:39.629Z')
    },
    create: {
      id: '4bfc9a9d-4113-426f-b744-f2ddbf49b73f',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:05:39.629Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '49381307-f181-4650-9e45-97528575ed2a' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:05:52.408Z')
    },
    create: {
      id: '49381307-f181-4650-9e45-97528575ed2a',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:05:52.408Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'e2faf52b-c669-4f36-99f6-90f3768c5358' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:06:11.598Z')
    },
    create: {
      id: 'e2faf52b-c669-4f36-99f6-90f3768c5358',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:06:11.598Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '84a4213d-1e02-40da-8c35-6790dece4655' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:06:39.600Z')
    },
    create: {
      id: '84a4213d-1e02-40da-8c35-6790dece4655',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:06:39.600Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'bb617afc-0941-4fa0-8cd0-2d8c5dd1ce07' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:07:01.613Z')
    },
    create: {
      id: 'bb617afc-0941-4fa0-8cd0-2d8c5dd1ce07',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:07:01.613Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'c93a6b8c-d50e-4d65-b7d5-ae22aaa8e566' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:07:21.198Z')
    },
    create: {
      id: 'c93a6b8c-d50e-4d65-b7d5-ae22aaa8e566',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:07:21.198Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '46435496-d4c9-4c23-b35c-3a73034bd785' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:07:39.621Z')
    },
    create: {
      id: '46435496-d4c9-4c23-b35c-3a73034bd785',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:07:39.621Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'c7bd4535-2542-4cf2-8c28-ebb78bbce582' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:08:17.483Z')
    },
    create: {
      id: 'c7bd4535-2542-4cf2-8c28-ebb78bbce582',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:08:17.483Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '1718a158-632a-4b86-aa26-9eed5c38d316' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:09:26.289Z')
    },
    create: {
      id: '1718a158-632a-4b86-aa26-9eed5c38d316',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:09:26.289Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '6c0c6f03-a37a-408c-babf-58a9246b0b8b' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:10:36.258Z')
    },
    create: {
      id: '6c0c6f03-a37a-408c-babf-58a9246b0b8b',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:10:36.258Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '177ec6ce-63b6-42a6-9fef-5d30fe77d008' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:11:46.275Z')
    },
    create: {
      id: '177ec6ce-63b6-42a6-9fef-5d30fe77d008',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:11:46.275Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'f1b0c3e7-7110-43d7-93d3-74845a422c75' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:12:46.301Z')
    },
    create: {
      id: 'f1b0c3e7-7110-43d7-93d3-74845a422c75',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:12:46.301Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'cca0d114-d5f8-410e-ae72-f95a1e62d3bc' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:13:46.330Z')
    },
    create: {
      id: 'cca0d114-d5f8-410e-ae72-f95a1e62d3bc',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:13:46.330Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '24355323-6c02-4f1a-ace9-41b31b0a6878' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:14:56.999Z')
    },
    create: {
      id: '24355323-6c02-4f1a-ace9-41b31b0a6878',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:14:56.999Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '301871f5-2e02-4e04-9e0b-29f3487f1540' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:16:06.543Z')
    },
    create: {
      id: '301871f5-2e02-4e04-9e0b-29f3487f1540',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.',
      logType: 'error',
      createdAt: new Date('2026-06-23T10:16:06.543Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'c985b98d-f5d5-4a2b-b4ce-3ae501e38604' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-24T05:00:35.122Z')
    },
    create: {
      id: 'c985b98d-f5d5-4a2b-b4ce-3ae501e38604',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-24T05:00:35.122Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '023c9484-4fb4-4310-ab7e-751ac2702b80' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-24T05:25:32.165Z')
    },
    create: {
      id: '023c9484-4fb4-4310-ab7e-751ac2702b80',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-24T05:25:32.165Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '170e27c4-2b91-4abe-b750-13c8f3d5ab16' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-24T05:25:59.396Z')
    },
    create: {
      id: '170e27c4-2b91-4abe-b750-13c8f3d5ab16',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-24T05:25:59.396Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '16f78f1b-67d2-4dbd-a240-5a4f53951ce6' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-24T05:30:23.959Z')
    },
    create: {
      id: '16f78f1b-67d2-4dbd-a240-5a4f53951ce6',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-24T05:30:23.959Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '76cb34dd-d6ad-4f7e-9065-8bb25eefa16f' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-24T05:49:53.446Z')
    },
    create: {
      id: '76cb34dd-d6ad-4f7e-9065-8bb25eefa16f',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-24T05:49:53.446Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '5f57d1d3-cd2b-4b5a-9e4b-806ca367ab8a' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Skipped trade execution for Vikash sharma: Kite session could not be established (auto-login failed or manual login required).',
      logType: 'error',
      createdAt: new Date('2026-06-24T07:20:42.551Z')
    },
    create: {
      id: '5f57d1d3-cd2b-4b5a-9e4b-806ca367ab8a',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Skipped trade execution for Vikash sharma: Kite session could not be established (auto-login failed or manual login required).',
      logType: 'error',
      createdAt: new Date('2026-06-24T07:20:42.551Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: '6f16ee84-45e0-41de-a2ab-cd8210549c5f' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-24T07:21:30.556Z')
    },
    create: {
      id: '6f16ee84-45e0-41de-a2ab-cd8210549c5f',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Strategy configuration updated.',
      logType: 'info',
      createdAt: new Date('2026-06-24T07:21:30.556Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'ac5df839-95ba-44d4-ac2c-6246ca31b038' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Skipped trade execution for Vikash sharma: Kite session could not be established (auto-login failed or manual login required).',
      logType: 'error',
      createdAt: new Date('2026-06-24T07:31:59.410Z')
    },
    create: {
      id: 'ac5df839-95ba-44d4-ac2c-6246ca31b038',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Skipped trade execution for Vikash sharma: Kite session could not be established (auto-login failed or manual login required).',
      logType: 'error',
      createdAt: new Date('2026-06-24T07:31:59.410Z')
    },
  });
  await prisma.strategyLog.upsert({
    where: { id: 'bff08933-0d44-4377-b43a-293e26f8f533' },
    update: {
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Intraday Trade Initiated for Vikash sharma: Bought 7 shares of PERSISTENT at entry price ₹4496.50 using config from DB strategy "Pre-Open Momentum Breakout". Capital at risk: ₹338.75. Target: ₹4586.42 (2%), Stop Loss: ₹4451.53 (1%). Entry Order: 260629170102587, SL Order: N/A, Target Order: N/A',
      logType: 'trade',
      createdAt: new Date('2026-06-29T03:51:15.150Z')
    },
    create: {
      id: 'bff08933-0d44-4377-b43a-293e26f8f533',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      message: 'Intraday Trade Initiated for Vikash sharma: Bought 7 shares of PERSISTENT at entry price ₹4496.50 using config from DB strategy "Pre-Open Momentum Breakout". Capital at risk: ₹338.75. Target: ₹4586.42 (2%), Stop Loss: ₹4451.53 (1%). Entry Order: 260629170102587, SL Order: N/A, Target Order: N/A',
      logType: 'trade',
      createdAt: new Date('2026-06-29T03:51:15.150Z')
    },
  });
  console.log('strategyLog: 118');


  // ──────────────────────────────────────────────
  // 12. Trades
  // ──────────────────────────────────────────────
  await prisma.trade.upsert({
    where: { id: 'ebd6e813-126d-4451-8c7a-95a018b3dcad' },
    update: {
      clientId: 'b364d72f-e2e2-4dbc-bbef-3286c75e1875',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      symbol: 'TATASTEEL',
      orderType: 'MIS',
      entryPrice: '"198"',
      exitPrice: null,
      quantity: 7,
      stopLoss: '"197.01"',
      target: '"200.97"',
      pnl: null,
      status: 'FAILED',
      entryTime: new Date('2026-06-17T21:21:36.316Z'),
      exitTime: null,
      kiteResponse: '{"data":null,"status":"error","message":"Our order management system is under scheduled maintenance. Try placing your AMO order after 5.30 AM.","error_type":"InputException"}',
      entryOrderId: null,
      entryOrderStatus: null,
      exitReason: null,
      slOrderId: null,
      slOrderStatus: null,
      slTriggerPrice: null,
      targetOrderId: null,
      targetOrderStatus: null,
      originalEntryPrice: null,
      originalStopLoss: null,
      originalTarget: null
    },
    create: {
      id: 'ebd6e813-126d-4451-8c7a-95a018b3dcad',
      clientId: 'b364d72f-e2e2-4dbc-bbef-3286c75e1875',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      symbol: 'TATASTEEL',
      orderType: 'MIS',
      entryPrice: '"198"',
      exitPrice: null,
      quantity: 7,
      stopLoss: '"197.01"',
      target: '"200.97"',
      pnl: null,
      status: 'FAILED',
      entryTime: new Date('2026-06-17T21:21:36.316Z'),
      exitTime: null,
      kiteResponse: '{"data":null,"status":"error","message":"Our order management system is under scheduled maintenance. Try placing your AMO order after 5.30 AM.","error_type":"InputException"}',
      entryOrderId: null,
      entryOrderStatus: null,
      exitReason: null,
      slOrderId: null,
      slOrderStatus: null,
      slTriggerPrice: null,
      targetOrderId: null,
      targetOrderStatus: null,
      originalEntryPrice: null,
      originalStopLoss: null,
      originalTarget: null
    },
  });
  await prisma.trade.upsert({
    where: { id: '61f91710-6cb2-4856-9799-0e0733f1fd5d' },
    update: {
      clientId: 'b364d72f-e2e2-4dbc-bbef-3286c75e1875',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      symbol: 'INFY',
      orderType: 'MIS',
      entryPrice: '"1142.9"',
      exitPrice: null,
      quantity: 87,
      stopLoss: '"1137.19"',
      target: '"1160.04"',
      pnl: null,
      status: 'FAILED',
      entryTime: new Date('2026-06-18T03:45:44.954Z'),
      exitTime: null,
      kiteResponse: '{"data":null,"status":"error","message":"Incorrect `api_key` or `access_token`.","error_type":"TokenException"}',
      entryOrderId: null,
      entryOrderStatus: null,
      exitReason: null,
      slOrderId: null,
      slOrderStatus: null,
      slTriggerPrice: null,
      targetOrderId: null,
      targetOrderStatus: null,
      originalEntryPrice: null,
      originalStopLoss: null,
      originalTarget: null
    },
    create: {
      id: '61f91710-6cb2-4856-9799-0e0733f1fd5d',
      clientId: 'b364d72f-e2e2-4dbc-bbef-3286c75e1875',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      symbol: 'INFY',
      orderType: 'MIS',
      entryPrice: '"1142.9"',
      exitPrice: null,
      quantity: 87,
      stopLoss: '"1137.19"',
      target: '"1160.04"',
      pnl: null,
      status: 'FAILED',
      entryTime: new Date('2026-06-18T03:45:44.954Z'),
      exitTime: null,
      kiteResponse: '{"data":null,"status":"error","message":"Incorrect `api_key` or `access_token`.","error_type":"TokenException"}',
      entryOrderId: null,
      entryOrderStatus: null,
      exitReason: null,
      slOrderId: null,
      slOrderStatus: null,
      slTriggerPrice: null,
      targetOrderId: null,
      targetOrderStatus: null,
      originalEntryPrice: null,
      originalStopLoss: null,
      originalTarget: null
    },
  });
  await prisma.trade.upsert({
    where: { id: '0e8b0e14-0687-4612-bc70-8c2b2f28e5df' },
    update: {
      clientId: 'b364d72f-e2e2-4dbc-bbef-3286c75e1875',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      symbol: 'MPHASIS',
      orderType: 'MIS',
      entryPrice: '"3040.24"',
      exitPrice: null,
      quantity: 0,
      stopLoss: null,
      target: null,
      pnl: null,
      status: 'FAILED',
      entryTime: new Date('2026-06-19T03:50:43.150Z'),
      exitTime: null,
      kiteResponse: '{"message":"Skipped: Calculated quantity is 0 (Allocated amount ₹854.90 is less than entry price ₹3040.24)."}',
      entryOrderId: null,
      entryOrderStatus: null,
      exitReason: null,
      slOrderId: null,
      slOrderStatus: null,
      slTriggerPrice: null,
      targetOrderId: null,
      targetOrderStatus: null,
      originalEntryPrice: null,
      originalStopLoss: null,
      originalTarget: null
    },
    create: {
      id: '0e8b0e14-0687-4612-bc70-8c2b2f28e5df',
      clientId: 'b364d72f-e2e2-4dbc-bbef-3286c75e1875',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      symbol: 'MPHASIS',
      orderType: 'MIS',
      entryPrice: '"3040.24"',
      exitPrice: null,
      quantity: 0,
      stopLoss: null,
      target: null,
      pnl: null,
      status: 'FAILED',
      entryTime: new Date('2026-06-19T03:50:43.150Z'),
      exitTime: null,
      kiteResponse: '{"message":"Skipped: Calculated quantity is 0 (Allocated amount ₹854.90 is less than entry price ₹3040.24)."}',
      entryOrderId: null,
      entryOrderStatus: null,
      exitReason: null,
      slOrderId: null,
      slOrderStatus: null,
      slTriggerPrice: null,
      targetOrderId: null,
      targetOrderStatus: null,
      originalEntryPrice: null,
      originalStopLoss: null,
      originalTarget: null
    },
  });
  await prisma.trade.upsert({
    where: { id: 'c6d9cc9b-fecf-4c8d-97bc-cfaec2224daf' },
    update: {
      clientId: 'b364d72f-e2e2-4dbc-bbef-3286c75e1875',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      symbol: 'CUMMINSIND',
      orderType: 'MIS',
      entryPrice: '"5769.76"',
      exitPrice: null,
      quantity: 6,
      stopLoss: '"5712.07"',
      target: '"5885.16"',
      pnl: null,
      status: 'FAILED',
      entryTime: new Date('2026-06-22T07:04:23.542Z'),
      exitTime: null,
      kiteResponse: '{"data":null,"status":"error","message":"Tick size for this script is 0.50. Kindly enter trigger price in the multiple of tick size for this script","error_type":"InputException"}',
      entryOrderId: null,
      entryOrderStatus: null,
      exitReason: null,
      slOrderId: null,
      slOrderStatus: null,
      slTriggerPrice: null,
      targetOrderId: null,
      targetOrderStatus: null,
      originalEntryPrice: null,
      originalStopLoss: null,
      originalTarget: null
    },
    create: {
      id: 'c6d9cc9b-fecf-4c8d-97bc-cfaec2224daf',
      clientId: 'b364d72f-e2e2-4dbc-bbef-3286c75e1875',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      symbol: 'CUMMINSIND',
      orderType: 'MIS',
      entryPrice: '"5769.76"',
      exitPrice: null,
      quantity: 6,
      stopLoss: '"5712.07"',
      target: '"5885.16"',
      pnl: null,
      status: 'FAILED',
      entryTime: new Date('2026-06-22T07:04:23.542Z'),
      exitTime: null,
      kiteResponse: '{"data":null,"status":"error","message":"Tick size for this script is 0.50. Kindly enter trigger price in the multiple of tick size for this script","error_type":"InputException"}',
      entryOrderId: null,
      entryOrderStatus: null,
      exitReason: null,
      slOrderId: null,
      slOrderStatus: null,
      slTriggerPrice: null,
      targetOrderId: null,
      targetOrderStatus: null,
      originalEntryPrice: null,
      originalStopLoss: null,
      originalTarget: null
    },
  });
  await prisma.trade.upsert({
    where: { id: 'f95d49c8-1912-435f-997d-9eeab8c1714e' },
    update: {
      clientId: 'b364d72f-e2e2-4dbc-bbef-3286c75e1875',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      symbol: 'VEDL',
      orderType: 'MIS',
      entryPrice: '"294.8"',
      exitPrice: null,
      quantity: 119,
      stopLoss: '"291.85"',
      target: '"300.7"',
      pnl: null,
      status: 'FAILED',
      entryTime: new Date('2026-06-23T09:09:15.069Z'),
      exitTime: new Date('2026-06-23T10:35:40.393Z'),
      kiteResponse: '{"note":"Market close exit rejected by Kite"}',
      entryOrderId: '260623171672769',
      entryOrderStatus: null,
      exitReason: 'Exit failed: MIS not allowed after 3:20 PM',
      slOrderId: null,
      slOrderStatus: null,
      slTriggerPrice: '"291.85"',
      targetOrderId: null,
      targetOrderStatus: null,
      originalEntryPrice: '"294.79"',
      originalStopLoss: '"291.85"',
      originalTarget: '"300.69"'
    },
    create: {
      id: 'f95d49c8-1912-435f-997d-9eeab8c1714e',
      clientId: 'b364d72f-e2e2-4dbc-bbef-3286c75e1875',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      symbol: 'VEDL',
      orderType: 'MIS',
      entryPrice: '"294.8"',
      exitPrice: null,
      quantity: 119,
      stopLoss: '"291.85"',
      target: '"300.7"',
      pnl: null,
      status: 'FAILED',
      entryTime: new Date('2026-06-23T09:09:15.069Z'),
      exitTime: new Date('2026-06-23T10:35:40.393Z'),
      kiteResponse: '{"note":"Market close exit rejected by Kite"}',
      entryOrderId: '260623171672769',
      entryOrderStatus: null,
      exitReason: 'Exit failed: MIS not allowed after 3:20 PM',
      slOrderId: null,
      slOrderStatus: null,
      slTriggerPrice: '"291.85"',
      targetOrderId: null,
      targetOrderStatus: null,
      originalEntryPrice: '"294.79"',
      originalStopLoss: '"291.85"',
      originalTarget: '"300.69"'
    },
  });
  await prisma.trade.upsert({
    where: { id: '4668adcc-92c7-4efb-80b4-b79c1c16c2ab' },
    update: {
      clientId: 'b364d72f-e2e2-4dbc-bbef-3286c75e1875',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      symbol: 'IRFC',
      orderType: 'MIS',
      entryPrice: '"143.29"',
      exitPrice: null,
      quantity: 0,
      stopLoss: null,
      target: null,
      pnl: null,
      status: 'FAILED',
      entryTime: new Date('2026-06-24T07:31:59.083Z'),
      exitTime: null,
      kiteResponse: '{"message":"Skipped: Kite session could not be established (auto-login failed or manual login required)."}',
      entryOrderId: null,
      entryOrderStatus: null,
      exitReason: null,
      slOrderId: null,
      slOrderStatus: null,
      slTriggerPrice: null,
      targetOrderId: null,
      targetOrderStatus: null,
      originalEntryPrice: null,
      originalStopLoss: null,
      originalTarget: null
    },
    create: {
      id: '4668adcc-92c7-4efb-80b4-b79c1c16c2ab',
      clientId: 'b364d72f-e2e2-4dbc-bbef-3286c75e1875',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      symbol: 'IRFC',
      orderType: 'MIS',
      entryPrice: '"143.29"',
      exitPrice: null,
      quantity: 0,
      stopLoss: null,
      target: null,
      pnl: null,
      status: 'FAILED',
      entryTime: new Date('2026-06-24T07:31:59.083Z'),
      exitTime: null,
      kiteResponse: '{"message":"Skipped: Kite session could not be established (auto-login failed or manual login required)."}',
      entryOrderId: null,
      entryOrderStatus: null,
      exitReason: null,
      slOrderId: null,
      slOrderStatus: null,
      slTriggerPrice: null,
      targetOrderId: null,
      targetOrderStatus: null,
      originalEntryPrice: null,
      originalStopLoss: null,
      originalTarget: null
    },
  });
  await prisma.trade.upsert({
    where: { id: 'da033718-fbdc-41bc-ade4-a00e67fe2240' },
    update: {
      clientId: 'b364d72f-e2e2-4dbc-bbef-3286c75e1875',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      symbol: 'HINDZINC',
      orderType: 'SL-M',
      entryPrice: '"531.65"',
      exitPrice: null,
      quantity: 66,
      stopLoss: '"526.33"',
      target: '"542.28"',
      pnl: null,
      status: 'FAILED',
      entryTime: new Date('2026-06-25T03:50:00.000Z'),
      exitTime: null,
      kiteResponse: '{"error":"Order cancelled on Zerodha (manually updated)"}',
      entryOrderId: '260625170115615',
      entryOrderStatus: null,
      exitReason: 'CANCELLED manually',
      slOrderId: null,
      slOrderStatus: null,
      slTriggerPrice: null,
      targetOrderId: null,
      targetOrderStatus: null,
      originalEntryPrice: '"531.65"',
      originalStopLoss: '"526.33"',
      originalTarget: '"542.28"'
    },
    create: {
      id: 'da033718-fbdc-41bc-ade4-a00e67fe2240',
      clientId: 'b364d72f-e2e2-4dbc-bbef-3286c75e1875',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      symbol: 'HINDZINC',
      orderType: 'SL-M',
      entryPrice: '"531.65"',
      exitPrice: null,
      quantity: 66,
      stopLoss: '"526.33"',
      target: '"542.28"',
      pnl: null,
      status: 'FAILED',
      entryTime: new Date('2026-06-25T03:50:00.000Z'),
      exitTime: null,
      kiteResponse: '{"error":"Order cancelled on Zerodha (manually updated)"}',
      entryOrderId: '260625170115615',
      entryOrderStatus: null,
      exitReason: 'CANCELLED manually',
      slOrderId: null,
      slOrderStatus: null,
      slTriggerPrice: null,
      targetOrderId: null,
      targetOrderStatus: null,
      originalEntryPrice: '"531.65"',
      originalStopLoss: '"526.33"',
      originalTarget: '"542.28"'
    },
  });
  await prisma.trade.upsert({
    where: { id: '8b3cea71-f549-45d2-8bbf-323a7c1034b3' },
    update: {
      clientId: 'b364d72f-e2e2-4dbc-bbef-3286c75e1875',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      symbol: 'PERSISTENT',
      orderType: 'MIS',
      entryPrice: '"4497"',
      exitPrice: null,
      quantity: 7,
      stopLoss: '"4451.5"',
      target: '"4586.5"',
      pnl: null,
      status: 'open',
      entryTime: new Date('2026-06-29T03:51:14.956Z'),
      exitTime: null,
      kiteResponse: '{"data":{"order_id":"260629170102587"},"status":"success"}',
      entryOrderId: '260629170102587',
      entryOrderStatus: 'COMPLETE',
      exitReason: null,
      slOrderId: 'REJECTED',
      slOrderStatus: 'REJECTED',
      slTriggerPrice: '"4451.5"',
      targetOrderId: '260629170624955',
      targetOrderStatus: 'OPEN',
      originalEntryPrice: '"4496.49"',
      originalStopLoss: '"4451.53"',
      originalTarget: '"4586.42"'
    },
    create: {
      id: '8b3cea71-f549-45d2-8bbf-323a7c1034b3',
      clientId: 'b364d72f-e2e2-4dbc-bbef-3286c75e1875',
      strategyId: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      symbol: 'PERSISTENT',
      orderType: 'MIS',
      entryPrice: '"4497"',
      exitPrice: null,
      quantity: 7,
      stopLoss: '"4451.5"',
      target: '"4586.5"',
      pnl: null,
      status: 'open',
      entryTime: new Date('2026-06-29T03:51:14.956Z'),
      exitTime: null,
      kiteResponse: '{"data":{"order_id":"260629170102587"},"status":"success"}',
      entryOrderId: '260629170102587',
      entryOrderStatus: 'COMPLETE',
      exitReason: null,
      slOrderId: 'REJECTED',
      slOrderStatus: 'REJECTED',
      slTriggerPrice: '"4451.5"',
      targetOrderId: '260629170624955',
      targetOrderStatus: 'OPEN',
      originalEntryPrice: '"4496.49"',
      originalStopLoss: '"4451.53"',
      originalTarget: '"4586.42"'
    },
  });
  console.log('trade: 8');


  // ──────────────────────────────────────────────
  // 13. Audit Logs
  // ──────────────────────────────────────────────
  await prisma.auditLog.upsert({
    where: { id: '90eb57d6-a462-40ab-8919-56548969c404' },
    update: {
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Auto Trading Stopped',
      oldValue: null,
      newValue: 'Algorithmic terminal engine powered off | Endpoint: POST /api/trading/toggle | Payload: {"active":false} | Response: {"success":true,"isTradingActive":false}',
      createdAt: new Date('2026-06-24T18:28:20.838Z')
    },
    create: {
      id: '90eb57d6-a462-40ab-8919-56548969c404',
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Auto Trading Stopped',
      oldValue: null,
      newValue: 'Algorithmic terminal engine powered off | Endpoint: POST /api/trading/toggle | Payload: {"active":false} | Response: {"success":true,"isTradingActive":false}',
      createdAt: new Date('2026-06-24T18:28:20.838Z')
    },
  });
  await prisma.auditLog.upsert({
    where: { id: 'c4d65714-6193-4486-9ace-4b3f18dc42c1' },
    update: {
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Auto Trading Started',
      oldValue: null,
      newValue: 'Algorithmic terminal engine powered on | Endpoint: POST /api/trading/toggle | Payload: {"active":true} | Response: {"success":true,"isTradingActive":true}',
      createdAt: new Date('2026-06-24T18:28:25.438Z')
    },
    create: {
      id: 'c4d65714-6193-4486-9ace-4b3f18dc42c1',
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Auto Trading Started',
      oldValue: null,
      newValue: 'Algorithmic terminal engine powered on | Endpoint: POST /api/trading/toggle | Payload: {"active":true} | Response: {"success":true,"isTradingActive":true}',
      createdAt: new Date('2026-06-24T18:28:25.438Z')
    },
  });
  await prisma.auditLog.upsert({
    where: { id: '58e47dbd-ed29-4ae1-8e66-6170c248ff30' },
    update: {
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Kite Token Disconnected',
      oldValue: null,
      newValue: 'Disconnected active Kite session token for Vikash sharma | Endpoint: PUT /api/clients/b364d72f-e2e2-4dbc-bbef-3286c75e1875 | Payload: {"accessToken":null} | Response: {"id":"b364d72f-e2e2-4dbc-bbef-3286c75e1875","userId":"846d4c97-be94-4a06-a72c-c048daf71e3c","zerodhaClientId":"RZJ500","accessToken":null,"capital":"500000","strategyId":"c7bafa89-3403-44c3-bcd0-199602c878e1","tradingStatus":"active","subscriptionStatus":"active","createdAt":"2026-06-13T07:58:14.215Z","updatedAt":"2026-06-24T18:28:55.617Z","zerodhaApiKey":"4y7j026qyv9lkacw","zerodhaApiSecret":"xr2qwbkkn0kj8gbuzuwyn19ggxlxgye9","zerodhaSession":null,"zerodhaPassword":"987654321","zerodhaTotpSecret":"JT5PXX4UOZZYNHTV7X525T6QSA4QNQDQ","aadhaarNumber":"","dob":"","kycStatus":"verified","panNumber":"","productTypeId":"prod-algo","user":{"id":"846d4c97-be94-4a06-a72c-c048daf71e3c","name":"Vikash sharma","email":"vikash@gmail.com","mobile":null,"userId":"vikashsharma162","password":"grw_QyWf8D2n","role":"client","status":"active","createdAt":"2026-06-13T07:58:14.195Z","updatedAt":"2026-06-24T17:57:54.840Z"},"strategy":{"id":"c7bafa89-3403-44c3-bcd0-199602c878e1","name":"Pre-Open Momentum Breakout","description":"Pre-Open Momentum Breakout Strategy","status":"active","configJson":"{\\"basicInfo\\":{\\"name\\":\\"Pre-Open Momentum Breakout\\",\\"status\\":\\"active\\",\\"segment\\":\\"NSE F&O\\",\\"exchange\\":\\"NSE\\",\\"entryTime\\":\\"09:20:30\\",\\"preSelectTime\\":\\"09:15:30\\",\\"selectPosition\\":1,\\"tradeType\\":\\"Intraday\\",\\"timeframe\\":\\"5m\\",\\"checkIntervalSec\\":60,\\"description\\":\\"Pre-Open Momentum Breakout Strategy\\",\\"exitTime\\":\\"15:24:00\\"},\\"stoploss\\":{\\"type\\":\\"Trailing SL\\",\\"orderType\\":\\"Market\\",\\"fixedPercent\\":1,\\"fixedPoints\\":10,\\"trailingSL\\":-1,\\"riskPercent\\":1},\\"target\\":{\\"type\\":\\"Trailing Target\\",\\"profitPercent\\":2,\\"riskRewardRatio\\":2,\\"partialExit\\":100,\\"trailingTarget\\":-1},\\"tradeAction\\":{\\"action\\":\\"Long\\",\\"orderType\\":\\"SL-Market\\",\\"bufferPercent\\":0.1,\\"candlePriceType\\":\\"high\\"},\\"riskManagement\\":{\\"riskPerTrade\\":1,\\"killSwitch\\":false,\\"maxOpenPositions\\":3,\\"maxDailyLoss\\":-1,\\"maxDailyProfit\\":-1,\\"capitalAllocation\\":-1,\\"misMarginRate\\":-1},\\"conditions\\":[]}","createdAt":"2026-06-16T12:59:09.893Z","updatedAt":"2026-06-24T17:57:55.343Z"},"productType":{"id":"prod-algo","name":"Algo","createdAt":"2026-06-22T01:06:32.766Z","updatedAt":"2026-06-24T17:57:53.522Z"}}',
      createdAt: new Date('2026-06-24T18:28:57.374Z')
    },
    create: {
      id: '58e47dbd-ed29-4ae1-8e66-6170c248ff30',
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Kite Token Disconnected',
      oldValue: null,
      newValue: 'Disconnected active Kite session token for Vikash sharma | Endpoint: PUT /api/clients/b364d72f-e2e2-4dbc-bbef-3286c75e1875 | Payload: {"accessToken":null} | Response: {"id":"b364d72f-e2e2-4dbc-bbef-3286c75e1875","userId":"846d4c97-be94-4a06-a72c-c048daf71e3c","zerodhaClientId":"RZJ500","accessToken":null,"capital":"500000","strategyId":"c7bafa89-3403-44c3-bcd0-199602c878e1","tradingStatus":"active","subscriptionStatus":"active","createdAt":"2026-06-13T07:58:14.215Z","updatedAt":"2026-06-24T18:28:55.617Z","zerodhaApiKey":"4y7j026qyv9lkacw","zerodhaApiSecret":"xr2qwbkkn0kj8gbuzuwyn19ggxlxgye9","zerodhaSession":null,"zerodhaPassword":"987654321","zerodhaTotpSecret":"JT5PXX4UOZZYNHTV7X525T6QSA4QNQDQ","aadhaarNumber":"","dob":"","kycStatus":"verified","panNumber":"","productTypeId":"prod-algo","user":{"id":"846d4c97-be94-4a06-a72c-c048daf71e3c","name":"Vikash sharma","email":"vikash@gmail.com","mobile":null,"userId":"vikashsharma162","password":"grw_QyWf8D2n","role":"client","status":"active","createdAt":"2026-06-13T07:58:14.195Z","updatedAt":"2026-06-24T17:57:54.840Z"},"strategy":{"id":"c7bafa89-3403-44c3-bcd0-199602c878e1","name":"Pre-Open Momentum Breakout","description":"Pre-Open Momentum Breakout Strategy","status":"active","configJson":"{\\"basicInfo\\":{\\"name\\":\\"Pre-Open Momentum Breakout\\",\\"status\\":\\"active\\",\\"segment\\":\\"NSE F&O\\",\\"exchange\\":\\"NSE\\",\\"entryTime\\":\\"09:20:30\\",\\"preSelectTime\\":\\"09:15:30\\",\\"selectPosition\\":1,\\"tradeType\\":\\"Intraday\\",\\"timeframe\\":\\"5m\\",\\"checkIntervalSec\\":60,\\"description\\":\\"Pre-Open Momentum Breakout Strategy\\",\\"exitTime\\":\\"15:24:00\\"},\\"stoploss\\":{\\"type\\":\\"Trailing SL\\",\\"orderType\\":\\"Market\\",\\"fixedPercent\\":1,\\"fixedPoints\\":10,\\"trailingSL\\":-1,\\"riskPercent\\":1},\\"target\\":{\\"type\\":\\"Trailing Target\\",\\"profitPercent\\":2,\\"riskRewardRatio\\":2,\\"partialExit\\":100,\\"trailingTarget\\":-1},\\"tradeAction\\":{\\"action\\":\\"Long\\",\\"orderType\\":\\"SL-Market\\",\\"bufferPercent\\":0.1,\\"candlePriceType\\":\\"high\\"},\\"riskManagement\\":{\\"riskPerTrade\\":1,\\"killSwitch\\":false,\\"maxOpenPositions\\":3,\\"maxDailyLoss\\":-1,\\"maxDailyProfit\\":-1,\\"capitalAllocation\\":-1,\\"misMarginRate\\":-1},\\"conditions\\":[]}","createdAt":"2026-06-16T12:59:09.893Z","updatedAt":"2026-06-24T17:57:55.343Z"},"productType":{"id":"prod-algo","name":"Algo","createdAt":"2026-06-22T01:06:32.766Z","updatedAt":"2026-06-24T17:57:53.522Z"}}',
      createdAt: new Date('2026-06-24T18:28:57.374Z')
    },
  });
  await prisma.auditLog.upsert({
    where: { id: 'f0378bdb-37e2-4740-9c32-0eb0233bff1f' },
    update: {
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Kite Token Disconnected',
      oldValue: null,
      newValue: 'Disconnected active Kite session token for Vikash sharma | Endpoint: PUT /api/clients/b364d72f-e2e2-4dbc-bbef-3286c75e1875 | Payload: {"accessToken":null} | Response: {"id":"b364d72f-e2e2-4dbc-bbef-3286c75e1875","userId":"846d4c97-be94-4a06-a72c-c048daf71e3c","zerodhaClientId":"RZJ500","accessToken":null,"capital":"500000","strategyId":"c7bafa89-3403-44c3-bcd0-199602c878e1","tradingStatus":"active","subscriptionStatus":"active","createdAt":"2026-06-13T07:58:14.215Z","updatedAt":"2026-06-24T18:29:08.679Z","zerodhaApiKey":"4y7j026qyv9lkacw","zerodhaApiSecret":"xr2qwbkkn0kj8gbuzuwyn19ggxlxgye9","zerodhaSession":null,"zerodhaPassword":"987654321","zerodhaTotpSecret":"JT5PXX4UOZZYNHTV7X525T6QSA4QNQDQ","aadhaarNumber":"","dob":"","kycStatus":"verified","panNumber":"","productTypeId":"prod-algo","user":{"id":"846d4c97-be94-4a06-a72c-c048daf71e3c","name":"Vikash sharma","email":"vikash@gmail.com","mobile":null,"userId":"vikashsharma162","password":"grw_QyWf8D2n","role":"client","status":"active","createdAt":"2026-06-13T07:58:14.195Z","updatedAt":"2026-06-24T17:57:54.840Z"},"strategy":{"id":"c7bafa89-3403-44c3-bcd0-199602c878e1","name":"Pre-Open Momentum Breakout","description":"Pre-Open Momentum Breakout Strategy","status":"active","configJson":"{\\"basicInfo\\":{\\"name\\":\\"Pre-Open Momentum Breakout\\",\\"status\\":\\"active\\",\\"segment\\":\\"NSE F&O\\",\\"exchange\\":\\"NSE\\",\\"entryTime\\":\\"09:20:30\\",\\"preSelectTime\\":\\"09:15:30\\",\\"selectPosition\\":1,\\"tradeType\\":\\"Intraday\\",\\"timeframe\\":\\"5m\\",\\"checkIntervalSec\\":60,\\"description\\":\\"Pre-Open Momentum Breakout Strategy\\",\\"exitTime\\":\\"15:24:00\\"},\\"stoploss\\":{\\"type\\":\\"Trailing SL\\",\\"orderType\\":\\"Market\\",\\"fixedPercent\\":1,\\"fixedPoints\\":10,\\"trailingSL\\":-1,\\"riskPercent\\":1},\\"target\\":{\\"type\\":\\"Trailing Target\\",\\"profitPercent\\":2,\\"riskRewardRatio\\":2,\\"partialExit\\":100,\\"trailingTarget\\":-1},\\"tradeAction\\":{\\"action\\":\\"Long\\",\\"orderType\\":\\"SL-Market\\",\\"bufferPercent\\":0.1,\\"candlePriceType\\":\\"high\\"},\\"riskManagement\\":{\\"riskPerTrade\\":1,\\"killSwitch\\":false,\\"maxOpenPositions\\":3,\\"maxDailyLoss\\":-1,\\"maxDailyProfit\\":-1,\\"capitalAllocation\\":-1,\\"misMarginRate\\":-1},\\"conditions\\":[]}","createdAt":"2026-06-16T12:59:09.893Z","updatedAt":"2026-06-24T17:57:55.343Z"},"productType":{"id":"prod-algo","name":"Algo","createdAt":"2026-06-22T01:06:32.766Z","updatedAt":"2026-06-24T17:57:53.522Z"}}',
      createdAt: new Date('2026-06-24T18:29:10.399Z')
    },
    create: {
      id: 'f0378bdb-37e2-4740-9c32-0eb0233bff1f',
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Kite Token Disconnected',
      oldValue: null,
      newValue: 'Disconnected active Kite session token for Vikash sharma | Endpoint: PUT /api/clients/b364d72f-e2e2-4dbc-bbef-3286c75e1875 | Payload: {"accessToken":null} | Response: {"id":"b364d72f-e2e2-4dbc-bbef-3286c75e1875","userId":"846d4c97-be94-4a06-a72c-c048daf71e3c","zerodhaClientId":"RZJ500","accessToken":null,"capital":"500000","strategyId":"c7bafa89-3403-44c3-bcd0-199602c878e1","tradingStatus":"active","subscriptionStatus":"active","createdAt":"2026-06-13T07:58:14.215Z","updatedAt":"2026-06-24T18:29:08.679Z","zerodhaApiKey":"4y7j026qyv9lkacw","zerodhaApiSecret":"xr2qwbkkn0kj8gbuzuwyn19ggxlxgye9","zerodhaSession":null,"zerodhaPassword":"987654321","zerodhaTotpSecret":"JT5PXX4UOZZYNHTV7X525T6QSA4QNQDQ","aadhaarNumber":"","dob":"","kycStatus":"verified","panNumber":"","productTypeId":"prod-algo","user":{"id":"846d4c97-be94-4a06-a72c-c048daf71e3c","name":"Vikash sharma","email":"vikash@gmail.com","mobile":null,"userId":"vikashsharma162","password":"grw_QyWf8D2n","role":"client","status":"active","createdAt":"2026-06-13T07:58:14.195Z","updatedAt":"2026-06-24T17:57:54.840Z"},"strategy":{"id":"c7bafa89-3403-44c3-bcd0-199602c878e1","name":"Pre-Open Momentum Breakout","description":"Pre-Open Momentum Breakout Strategy","status":"active","configJson":"{\\"basicInfo\\":{\\"name\\":\\"Pre-Open Momentum Breakout\\",\\"status\\":\\"active\\",\\"segment\\":\\"NSE F&O\\",\\"exchange\\":\\"NSE\\",\\"entryTime\\":\\"09:20:30\\",\\"preSelectTime\\":\\"09:15:30\\",\\"selectPosition\\":1,\\"tradeType\\":\\"Intraday\\",\\"timeframe\\":\\"5m\\",\\"checkIntervalSec\\":60,\\"description\\":\\"Pre-Open Momentum Breakout Strategy\\",\\"exitTime\\":\\"15:24:00\\"},\\"stoploss\\":{\\"type\\":\\"Trailing SL\\",\\"orderType\\":\\"Market\\",\\"fixedPercent\\":1,\\"fixedPoints\\":10,\\"trailingSL\\":-1,\\"riskPercent\\":1},\\"target\\":{\\"type\\":\\"Trailing Target\\",\\"profitPercent\\":2,\\"riskRewardRatio\\":2,\\"partialExit\\":100,\\"trailingTarget\\":-1},\\"tradeAction\\":{\\"action\\":\\"Long\\",\\"orderType\\":\\"SL-Market\\",\\"bufferPercent\\":0.1,\\"candlePriceType\\":\\"high\\"},\\"riskManagement\\":{\\"riskPerTrade\\":1,\\"killSwitch\\":false,\\"maxOpenPositions\\":3,\\"maxDailyLoss\\":-1,\\"maxDailyProfit\\":-1,\\"capitalAllocation\\":-1,\\"misMarginRate\\":-1},\\"conditions\\":[]}","createdAt":"2026-06-16T12:59:09.893Z","updatedAt":"2026-06-24T17:57:55.343Z"},"productType":{"id":"prod-algo","name":"Algo","createdAt":"2026-06-22T01:06:32.766Z","updatedAt":"2026-06-24T17:57:53.522Z"}}',
      createdAt: new Date('2026-06-24T18:29:10.399Z')
    },
  });
  await prisma.auditLog.upsert({
    where: { id: '39a7b80f-0330-4160-9fd8-91807733e529' },
    update: {
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Kite Token Auto-Refreshed',
      oldValue: null,
      newValue: 'Token refreshed for Vikash sharma',
      createdAt: new Date('2026-06-24T18:29:21.606Z')
    },
    create: {
      id: '39a7b80f-0330-4160-9fd8-91807733e529',
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Kite Token Auto-Refreshed',
      oldValue: null,
      newValue: 'Token refreshed for Vikash sharma',
      createdAt: new Date('2026-06-24T18:29:21.606Z')
    },
  });
  await prisma.auditLog.upsert({
    where: { id: '6bb744c4-27b3-4a86-b30e-9317a79dfe2f' },
    update: {
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Kite Token Auto-Refreshed',
      oldValue: null,
      newValue: 'Token refreshed for Vikash sharma',
      createdAt: new Date('2026-06-24T18:29:44.315Z')
    },
    create: {
      id: '6bb744c4-27b3-4a86-b30e-9317a79dfe2f',
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Kite Token Auto-Refreshed',
      oldValue: null,
      newValue: 'Token refreshed for Vikash sharma',
      createdAt: new Date('2026-06-24T18:29:44.315Z')
    },
  });
  await prisma.auditLog.upsert({
    where: { id: 'dc0030a4-d984-4e96-b595-57b8b06c8a67' },
    update: {
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Trading Status Changed',
      oldValue: null,
      newValue: 'Trading status of client Vikash sharma changed to ACTIVE | Endpoint: PUT /api/clients/b364d72f-e2e2-4dbc-bbef-3286c75e1875 | Payload: {"name":"Vikash sharma","email":"vikash@gmail.com","userId":"vikashsharma162","password":"grw_QyWf8D2n","zerodhaClientId":"RZJ500","zerodhaApiKey":"4y7j026qyv9lkacw","zerodhaApiSecret":"xr2qwbkkn0kj8gbuzuwyn19ggxlxgye9","zerodhaPassword":"987654321","zerodhaTotpSecret":"JT5PXX4UOZZYNHTV7X525T6QSA4QNQDQ","capital":500000,"tradingStatus":"active","panNumber":"","aadhaarNumber":"","dob":"","kycStatus":"verified","productTypeId":"prod-algo"} | Response: {"id":"b364d72f-e2e2-4dbc-bbef-3286c75e1875","userId":"846d4c97-be94-4a06-a72c-c048daf71e3c","zerodhaClientId":"RZJ500","accessToken":"nKDLbxnRhHFcvp6BCqqFkwvwcIlTAzyq","capital":"500000","strategyId":"c7bafa89-3403-44c3-bcd0-199602c878e1","tradingStatus":"active","subscriptionStatus":"active","createdAt":"2026-06-13T07:58:14.215Z","updatedAt":"2026-06-24T18:32:00.106Z","zerodhaApiKey":"4y7j026qyv9lkacw","zerodhaApiSecret":"xr2qwbkkn0kj8gbuzuwyn19ggxlxgye9","zerodhaSession":"{\\"user_type\\":\\"individual/ind_with_nom\\",\\"email\\":\\"js9650141@gmail.com\\",\\"user_name\\":\\"Janvi Sharma\\",\\"user_shortname\\":\\"Janvi\\",\\"broker\\":\\"ZERODHA\\",\\"exchanges\\":[\\"BSE\\",\\"MF\\",\\"NSE\\"],\\"products\\":[\\"CNC\\",\\"NRML\\",\\"MIS\\",\\"BO\\",\\"CO\\"],\\"order_types\\":[\\"MARKET\\",\\"LIMIT\\",\\"SL\\",\\"SL-M\\"],\\"avatar_url\\":null,\\"user_id\\":\\"RZJ500\\",\\"api_key\\":\\"4y7j026qyv9lkacw\\",\\"access_token\\":\\"nKDLbxnRhHFcvp6BCqqFkwvwcIlTAzyq\\",\\"public_token\\":\\"6vd1MIvPV93tQc2BTiSUDCE0QVhD0v8S\\",\\"refresh_token\\":\\"\\",\\"enctoken\\":\\"pdb3OZcx9DKlh88jowK1JTrQABr+XbtmGyoS4z8ProrgaOJ85ANrrRxC/WyILqQyUjsc/c0h0UBulJP1EGj++ZCeiONQ8HvAq0b+obEiQ+ZLshFTx4ZPoxgGJ+3DLeo=\\",\\"login_time\\":\\"2026-06-24 10:31:07\\",\\"meta\\":{\\"demat_consent\\":\\"consent\\"}}","zerodhaPassword":"987654321","zerodhaTotpSecret":"JT5PXX4UOZZYNHTV7X525T6QSA4QNQDQ","aadhaarNumber":"","dob":"","kycStatus":"verified","panNumber":"","productTypeId":"prod-algo","user":{"id":"846d4c97-be94-4a06-a72c-c048daf71e3c","name":"Vikash sharma","email":"vikash@gmail.com","mobile":null,"userId":"vikashsharma162","password":"grw_QyWf8D2n","role":"client","status":"active","createdAt":"2026-06-13T07:58:14.195Z","updatedAt":"2026-06-24T18:31:59.648Z"},"strategy":{"id":"c7bafa89-3403-44c3-bcd0-199602c878e1","name":"Pre-Open Momentum Breakout","description":"Pre-Open Momentum Breakout Strategy","status":"active","configJson":"{\\"basicInfo\\":{\\"name\\":\\"Pre-Open Momentum Breakout\\",\\"status\\":\\"active\\",\\"segment\\":\\"NSE F&O\\",\\"exchange\\":\\"NSE\\",\\"entryTime\\":\\"09:20:30\\",\\"preSelectTime\\":\\"09:15:30\\",\\"selectPosition\\":1,\\"tradeType\\":\\"Intraday\\",\\"timeframe\\":\\"5m\\",\\"checkIntervalSec\\":60,\\"description\\":\\"Pre-Open Momentum Breakout Strategy\\",\\"exitTime\\":\\"15:24:00\\"},\\"stoploss\\":{\\"type\\":\\"Trailing SL\\",\\"orderType\\":\\"Market\\",\\"fixedPercent\\":1,\\"fixedPoints\\":10,\\"trailingSL\\":-1,\\"riskPercent\\":1},\\"target\\":{\\"type\\":\\"Trailing Target\\",\\"profitPercent\\":2,\\"riskRewardRatio\\":2,\\"partialExit\\":100,\\"trailingTarget\\":-1},\\"tradeAction\\":{\\"action\\":\\"Long\\",\\"orderType\\":\\"SL-Market\\",\\"bufferPercent\\":0.1,\\"candlePriceType\\":\\"high\\"},\\"riskManagement\\":{\\"riskPerTrade\\":1,\\"killSwitch\\":false,\\"maxOpenPositions\\":3,\\"maxDailyLoss\\":-1,\\"maxDailyProfit\\":-1,\\"capitalAllocation\\":-1,\\"misMarginRate\\":-1},\\"conditions\\":[]}","createdAt":"2026-06-16T12:59:09.893Z","updatedAt":"2026-06-24T17:57:55.343Z"},"productType":{"id":"prod-algo","name":"Algo","createdAt":"2026-06-22T01:06:32.766Z","updatedAt":"2026-06-24T17:57:53.522Z"}}',
      createdAt: new Date('2026-06-24T18:32:01.728Z')
    },
    create: {
      id: 'dc0030a4-d984-4e96-b595-57b8b06c8a67',
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Trading Status Changed',
      oldValue: null,
      newValue: 'Trading status of client Vikash sharma changed to ACTIVE | Endpoint: PUT /api/clients/b364d72f-e2e2-4dbc-bbef-3286c75e1875 | Payload: {"name":"Vikash sharma","email":"vikash@gmail.com","userId":"vikashsharma162","password":"grw_QyWf8D2n","zerodhaClientId":"RZJ500","zerodhaApiKey":"4y7j026qyv9lkacw","zerodhaApiSecret":"xr2qwbkkn0kj8gbuzuwyn19ggxlxgye9","zerodhaPassword":"987654321","zerodhaTotpSecret":"JT5PXX4UOZZYNHTV7X525T6QSA4QNQDQ","capital":500000,"tradingStatus":"active","panNumber":"","aadhaarNumber":"","dob":"","kycStatus":"verified","productTypeId":"prod-algo"} | Response: {"id":"b364d72f-e2e2-4dbc-bbef-3286c75e1875","userId":"846d4c97-be94-4a06-a72c-c048daf71e3c","zerodhaClientId":"RZJ500","accessToken":"nKDLbxnRhHFcvp6BCqqFkwvwcIlTAzyq","capital":"500000","strategyId":"c7bafa89-3403-44c3-bcd0-199602c878e1","tradingStatus":"active","subscriptionStatus":"active","createdAt":"2026-06-13T07:58:14.215Z","updatedAt":"2026-06-24T18:32:00.106Z","zerodhaApiKey":"4y7j026qyv9lkacw","zerodhaApiSecret":"xr2qwbkkn0kj8gbuzuwyn19ggxlxgye9","zerodhaSession":"{\\"user_type\\":\\"individual/ind_with_nom\\",\\"email\\":\\"js9650141@gmail.com\\",\\"user_name\\":\\"Janvi Sharma\\",\\"user_shortname\\":\\"Janvi\\",\\"broker\\":\\"ZERODHA\\",\\"exchanges\\":[\\"BSE\\",\\"MF\\",\\"NSE\\"],\\"products\\":[\\"CNC\\",\\"NRML\\",\\"MIS\\",\\"BO\\",\\"CO\\"],\\"order_types\\":[\\"MARKET\\",\\"LIMIT\\",\\"SL\\",\\"SL-M\\"],\\"avatar_url\\":null,\\"user_id\\":\\"RZJ500\\",\\"api_key\\":\\"4y7j026qyv9lkacw\\",\\"access_token\\":\\"nKDLbxnRhHFcvp6BCqqFkwvwcIlTAzyq\\",\\"public_token\\":\\"6vd1MIvPV93tQc2BTiSUDCE0QVhD0v8S\\",\\"refresh_token\\":\\"\\",\\"enctoken\\":\\"pdb3OZcx9DKlh88jowK1JTrQABr+XbtmGyoS4z8ProrgaOJ85ANrrRxC/WyILqQyUjsc/c0h0UBulJP1EGj++ZCeiONQ8HvAq0b+obEiQ+ZLshFTx4ZPoxgGJ+3DLeo=\\",\\"login_time\\":\\"2026-06-24 10:31:07\\",\\"meta\\":{\\"demat_consent\\":\\"consent\\"}}","zerodhaPassword":"987654321","zerodhaTotpSecret":"JT5PXX4UOZZYNHTV7X525T6QSA4QNQDQ","aadhaarNumber":"","dob":"","kycStatus":"verified","panNumber":"","productTypeId":"prod-algo","user":{"id":"846d4c97-be94-4a06-a72c-c048daf71e3c","name":"Vikash sharma","email":"vikash@gmail.com","mobile":null,"userId":"vikashsharma162","password":"grw_QyWf8D2n","role":"client","status":"active","createdAt":"2026-06-13T07:58:14.195Z","updatedAt":"2026-06-24T18:31:59.648Z"},"strategy":{"id":"c7bafa89-3403-44c3-bcd0-199602c878e1","name":"Pre-Open Momentum Breakout","description":"Pre-Open Momentum Breakout Strategy","status":"active","configJson":"{\\"basicInfo\\":{\\"name\\":\\"Pre-Open Momentum Breakout\\",\\"status\\":\\"active\\",\\"segment\\":\\"NSE F&O\\",\\"exchange\\":\\"NSE\\",\\"entryTime\\":\\"09:20:30\\",\\"preSelectTime\\":\\"09:15:30\\",\\"selectPosition\\":1,\\"tradeType\\":\\"Intraday\\",\\"timeframe\\":\\"5m\\",\\"checkIntervalSec\\":60,\\"description\\":\\"Pre-Open Momentum Breakout Strategy\\",\\"exitTime\\":\\"15:24:00\\"},\\"stoploss\\":{\\"type\\":\\"Trailing SL\\",\\"orderType\\":\\"Market\\",\\"fixedPercent\\":1,\\"fixedPoints\\":10,\\"trailingSL\\":-1,\\"riskPercent\\":1},\\"target\\":{\\"type\\":\\"Trailing Target\\",\\"profitPercent\\":2,\\"riskRewardRatio\\":2,\\"partialExit\\":100,\\"trailingTarget\\":-1},\\"tradeAction\\":{\\"action\\":\\"Long\\",\\"orderType\\":\\"SL-Market\\",\\"bufferPercent\\":0.1,\\"candlePriceType\\":\\"high\\"},\\"riskManagement\\":{\\"riskPerTrade\\":1,\\"killSwitch\\":false,\\"maxOpenPositions\\":3,\\"maxDailyLoss\\":-1,\\"maxDailyProfit\\":-1,\\"capitalAllocation\\":-1,\\"misMarginRate\\":-1},\\"conditions\\":[]}","createdAt":"2026-06-16T12:59:09.893Z","updatedAt":"2026-06-24T17:57:55.343Z"},"productType":{"id":"prod-algo","name":"Algo","createdAt":"2026-06-22T01:06:32.766Z","updatedAt":"2026-06-24T17:57:53.522Z"}}',
      createdAt: new Date('2026-06-24T18:32:01.728Z')
    },
  });
  await prisma.auditLog.upsert({
    where: { id: '076177d1-e0ad-40e4-904f-f8246a780232' },
    update: {
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Trading Status Changed',
      oldValue: null,
      newValue: 'Trading status of client Vikash sharma changed to ACTIVE | Endpoint: PUT /api/clients/b364d72f-e2e2-4dbc-bbef-3286c75e1875 | Payload: {"name":"Vikash sharma","email":"vikash@gmail.com","userId":"vikashsharma162","password":"grw_QyWf8D2n","zerodhaClientId":"RZJ500","zerodhaApiKey":"4y7j026qyv9lkacw","zerodhaApiSecret":"xr2qwbkkn0kj8gbuzuwyn19ggxlxgye9","zerodhaPassword":"987654321","zerodhaTotpSecret":"JT5PXX4UOZZYNHTV7X525T6QSA4QNQDQ","capital":100000,"tradingStatus":"active","panNumber":"","aadhaarNumber":"","dob":"","kycStatus":"verified","productTypeId":"prod-algo"} | Response: {"id":"b364d72f-e2e2-4dbc-bbef-3286c75e1875","userId":"846d4c97-be94-4a06-a72c-c048daf71e3c","zerodhaClientId":"RZJ500","accessToken":"nKDLbxnRhHFcvp6BCqqFkwvwcIlTAzyq","capital":"100000","strategyId":"c7bafa89-3403-44c3-bcd0-199602c878e1","tradingStatus":"active","subscriptionStatus":"active","createdAt":"2026-06-13T07:58:14.215Z","updatedAt":"2026-06-24T19:11:36.479Z","zerodhaApiKey":"4y7j026qyv9lkacw","zerodhaApiSecret":"xr2qwbkkn0kj8gbuzuwyn19ggxlxgye9","zerodhaSession":"{\\"user_type\\":\\"individual/ind_with_nom\\",\\"email\\":\\"js9650141@gmail.com\\",\\"user_name\\":\\"Janvi Sharma\\",\\"user_shortname\\":\\"Janvi\\",\\"broker\\":\\"ZERODHA\\",\\"exchanges\\":[\\"BSE\\",\\"MF\\",\\"NSE\\"],\\"products\\":[\\"CNC\\",\\"NRML\\",\\"MIS\\",\\"BO\\",\\"CO\\"],\\"order_types\\":[\\"MARKET\\",\\"LIMIT\\",\\"SL\\",\\"SL-M\\"],\\"avatar_url\\":null,\\"user_id\\":\\"RZJ500\\",\\"api_key\\":\\"4y7j026qyv9lkacw\\",\\"access_token\\":\\"nKDLbxnRhHFcvp6BCqqFkwvwcIlTAzyq\\",\\"public_token\\":\\"6vd1MIvPV93tQc2BTiSUDCE0QVhD0v8S\\",\\"refresh_token\\":\\"\\",\\"enctoken\\":\\"pdb3OZcx9DKlh88jowK1JTrQABr+XbtmGyoS4z8ProrgaOJ85ANrrRxC/WyILqQyUjsc/c0h0UBulJP1EGj++ZCeiONQ8HvAq0b+obEiQ+ZLshFTx4ZPoxgGJ+3DLeo=\\",\\"login_time\\":\\"2026-06-24 10:31:07\\",\\"meta\\":{\\"demat_consent\\":\\"consent\\"}}","zerodhaPassword":"987654321","zerodhaTotpSecret":"JT5PXX4UOZZYNHTV7X525T6QSA4QNQDQ","aadhaarNumber":"","dob":"","kycStatus":"verified","panNumber":"","productTypeId":"prod-algo","user":{"id":"846d4c97-be94-4a06-a72c-c048daf71e3c","name":"Vikash sharma","email":"vikash@gmail.com","mobile":null,"userId":"vikashsharma162","password":"grw_QyWf8D2n","role":"client","status":"active","createdAt":"2026-06-13T07:58:14.195Z","updatedAt":"2026-06-24T19:11:35.982Z"},"strategy":{"id":"c7bafa89-3403-44c3-bcd0-199602c878e1","name":"Pre-Open Momentum Breakout","description":"Pre-Open Momentum Breakout Strategy","status":"active","configJson":"{\\"basicInfo\\":{\\"name\\":\\"Pre-Open Momentum Breakout\\",\\"status\\":\\"active\\",\\"segment\\":\\"NSE F&O\\",\\"exchange\\":\\"NSE\\",\\"entryTime\\":\\"09:20:30\\",\\"preSelectTime\\":\\"09:15:30\\",\\"selectPosition\\":1,\\"tradeType\\":\\"Intraday\\",\\"timeframe\\":\\"5m\\",\\"checkIntervalSec\\":60,\\"description\\":\\"Pre-Open Momentum Breakout Strategy\\",\\"exitTime\\":\\"15:24:00\\"},\\"stoploss\\":{\\"type\\":\\"Trailing SL\\",\\"orderType\\":\\"Market\\",\\"fixedPercent\\":1,\\"fixedPoints\\":10,\\"trailingSL\\":-1,\\"riskPercent\\":1},\\"target\\":{\\"type\\":\\"Trailing Target\\",\\"profitPercent\\":2,\\"riskRewardRatio\\":2,\\"partialExit\\":100,\\"trailingTarget\\":-1},\\"tradeAction\\":{\\"action\\":\\"Long\\",\\"orderType\\":\\"SL-Market\\",\\"bufferPercent\\":0.1,\\"candlePriceType\\":\\"high\\"},\\"riskManagement\\":{\\"riskPerTrade\\":1,\\"killSwitch\\":false,\\"maxOpenPositions\\":3,\\"maxDailyLoss\\":-1,\\"maxDailyProfit\\":-1,\\"capitalAllocation\\":-1,\\"misMarginRate\\":-1},\\"conditions\\":[]}","createdAt":"2026-06-16T12:59:09.893Z","updatedAt":"2026-06-24T17:57:55.343Z"},"productType":{"id":"prod-algo","name":"Algo","createdAt":"2026-06-22T01:06:32.766Z","updatedAt":"2026-06-24T17:57:53.522Z"}}',
      createdAt: new Date('2026-06-24T19:11:38.216Z')
    },
    create: {
      id: '076177d1-e0ad-40e4-904f-f8246a780232',
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Trading Status Changed',
      oldValue: null,
      newValue: 'Trading status of client Vikash sharma changed to ACTIVE | Endpoint: PUT /api/clients/b364d72f-e2e2-4dbc-bbef-3286c75e1875 | Payload: {"name":"Vikash sharma","email":"vikash@gmail.com","userId":"vikashsharma162","password":"grw_QyWf8D2n","zerodhaClientId":"RZJ500","zerodhaApiKey":"4y7j026qyv9lkacw","zerodhaApiSecret":"xr2qwbkkn0kj8gbuzuwyn19ggxlxgye9","zerodhaPassword":"987654321","zerodhaTotpSecret":"JT5PXX4UOZZYNHTV7X525T6QSA4QNQDQ","capital":100000,"tradingStatus":"active","panNumber":"","aadhaarNumber":"","dob":"","kycStatus":"verified","productTypeId":"prod-algo"} | Response: {"id":"b364d72f-e2e2-4dbc-bbef-3286c75e1875","userId":"846d4c97-be94-4a06-a72c-c048daf71e3c","zerodhaClientId":"RZJ500","accessToken":"nKDLbxnRhHFcvp6BCqqFkwvwcIlTAzyq","capital":"100000","strategyId":"c7bafa89-3403-44c3-bcd0-199602c878e1","tradingStatus":"active","subscriptionStatus":"active","createdAt":"2026-06-13T07:58:14.215Z","updatedAt":"2026-06-24T19:11:36.479Z","zerodhaApiKey":"4y7j026qyv9lkacw","zerodhaApiSecret":"xr2qwbkkn0kj8gbuzuwyn19ggxlxgye9","zerodhaSession":"{\\"user_type\\":\\"individual/ind_with_nom\\",\\"email\\":\\"js9650141@gmail.com\\",\\"user_name\\":\\"Janvi Sharma\\",\\"user_shortname\\":\\"Janvi\\",\\"broker\\":\\"ZERODHA\\",\\"exchanges\\":[\\"BSE\\",\\"MF\\",\\"NSE\\"],\\"products\\":[\\"CNC\\",\\"NRML\\",\\"MIS\\",\\"BO\\",\\"CO\\"],\\"order_types\\":[\\"MARKET\\",\\"LIMIT\\",\\"SL\\",\\"SL-M\\"],\\"avatar_url\\":null,\\"user_id\\":\\"RZJ500\\",\\"api_key\\":\\"4y7j026qyv9lkacw\\",\\"access_token\\":\\"nKDLbxnRhHFcvp6BCqqFkwvwcIlTAzyq\\",\\"public_token\\":\\"6vd1MIvPV93tQc2BTiSUDCE0QVhD0v8S\\",\\"refresh_token\\":\\"\\",\\"enctoken\\":\\"pdb3OZcx9DKlh88jowK1JTrQABr+XbtmGyoS4z8ProrgaOJ85ANrrRxC/WyILqQyUjsc/c0h0UBulJP1EGj++ZCeiONQ8HvAq0b+obEiQ+ZLshFTx4ZPoxgGJ+3DLeo=\\",\\"login_time\\":\\"2026-06-24 10:31:07\\",\\"meta\\":{\\"demat_consent\\":\\"consent\\"}}","zerodhaPassword":"987654321","zerodhaTotpSecret":"JT5PXX4UOZZYNHTV7X525T6QSA4QNQDQ","aadhaarNumber":"","dob":"","kycStatus":"verified","panNumber":"","productTypeId":"prod-algo","user":{"id":"846d4c97-be94-4a06-a72c-c048daf71e3c","name":"Vikash sharma","email":"vikash@gmail.com","mobile":null,"userId":"vikashsharma162","password":"grw_QyWf8D2n","role":"client","status":"active","createdAt":"2026-06-13T07:58:14.195Z","updatedAt":"2026-06-24T19:11:35.982Z"},"strategy":{"id":"c7bafa89-3403-44c3-bcd0-199602c878e1","name":"Pre-Open Momentum Breakout","description":"Pre-Open Momentum Breakout Strategy","status":"active","configJson":"{\\"basicInfo\\":{\\"name\\":\\"Pre-Open Momentum Breakout\\",\\"status\\":\\"active\\",\\"segment\\":\\"NSE F&O\\",\\"exchange\\":\\"NSE\\",\\"entryTime\\":\\"09:20:30\\",\\"preSelectTime\\":\\"09:15:30\\",\\"selectPosition\\":1,\\"tradeType\\":\\"Intraday\\",\\"timeframe\\":\\"5m\\",\\"checkIntervalSec\\":60,\\"description\\":\\"Pre-Open Momentum Breakout Strategy\\",\\"exitTime\\":\\"15:24:00\\"},\\"stoploss\\":{\\"type\\":\\"Trailing SL\\",\\"orderType\\":\\"Market\\",\\"fixedPercent\\":1,\\"fixedPoints\\":10,\\"trailingSL\\":-1,\\"riskPercent\\":1},\\"target\\":{\\"type\\":\\"Trailing Target\\",\\"profitPercent\\":2,\\"riskRewardRatio\\":2,\\"partialExit\\":100,\\"trailingTarget\\":-1},\\"tradeAction\\":{\\"action\\":\\"Long\\",\\"orderType\\":\\"SL-Market\\",\\"bufferPercent\\":0.1,\\"candlePriceType\\":\\"high\\"},\\"riskManagement\\":{\\"riskPerTrade\\":1,\\"killSwitch\\":false,\\"maxOpenPositions\\":3,\\"maxDailyLoss\\":-1,\\"maxDailyProfit\\":-1,\\"capitalAllocation\\":-1,\\"misMarginRate\\":-1},\\"conditions\\":[]}","createdAt":"2026-06-16T12:59:09.893Z","updatedAt":"2026-06-24T17:57:55.343Z"},"productType":{"id":"prod-algo","name":"Algo","createdAt":"2026-06-22T01:06:32.766Z","updatedAt":"2026-06-24T17:57:53.522Z"}}',
      createdAt: new Date('2026-06-24T19:11:38.216Z')
    },
  });
  await prisma.auditLog.upsert({
    where: { id: '52cd7a79-bff3-4168-9012-147758f28fd1' },
    update: {
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Kite Token Disconnected',
      oldValue: null,
      newValue: 'Disconnected active Kite session token for Vikash sharma | Endpoint: PUT /api/clients/b364d72f-e2e2-4dbc-bbef-3286c75e1875 | Payload: {"accessToken":null} | Response: {"id":"b364d72f-e2e2-4dbc-bbef-3286c75e1875","userId":"846d4c97-be94-4a06-a72c-c048daf71e3c","zerodhaClientId":"RZJ500","accessToken":null,"capital":"100000","strategyId":"c7bafa89-3403-44c3-bcd0-199602c878e1","tradingStatus":"active","subscriptionStatus":"active","createdAt":"2026-06-13T07:58:14.215Z","updatedAt":"2026-06-24T20:09:55.187Z","zerodhaApiKey":"4y7j026qyv9lkacw","zerodhaApiSecret":"xr2qwbkkn0kj8gbuzuwyn19ggxlxgye9","zerodhaSession":null,"zerodhaPassword":"987654321","zerodhaTotpSecret":"JT5PXX4UOZZYNHTV7X525T6QSA4QNQDQ","aadhaarNumber":"","dob":"","kycStatus":"verified","panNumber":"","productTypeId":"prod-algo","user":{"id":"846d4c97-be94-4a06-a72c-c048daf71e3c","name":"Vikash sharma","email":"vikash@gmail.com","mobile":null,"userId":"vikashsharma162","password":"grw_QyWf8D2n","role":"client","status":"active","createdAt":"2026-06-13T07:58:14.195Z","updatedAt":"2026-06-24T19:11:35.982Z"},"strategy":{"id":"c7bafa89-3403-44c3-bcd0-199602c878e1","name":"Pre-Open Momentum Breakout","description":"Pre-Open Momentum Breakout Strategy","status":"active","configJson":"{\\"basicInfo\\":{\\"name\\":\\"Pre-Open Momentum Breakout\\",\\"status\\":\\"active\\",\\"segment\\":\\"NSE F&O\\",\\"exchange\\":\\"NSE\\",\\"entryTime\\":\\"09:20:30\\",\\"preSelectTime\\":\\"09:15:30\\",\\"selectPosition\\":1,\\"tradeType\\":\\"Intraday\\",\\"timeframe\\":\\"5m\\",\\"checkIntervalSec\\":60,\\"description\\":\\"Pre-Open Momentum Breakout Strategy\\",\\"exitTime\\":\\"15:24:00\\"},\\"stoploss\\":{\\"type\\":\\"Trailing SL\\",\\"orderType\\":\\"Market\\",\\"fixedPercent\\":1,\\"fixedPoints\\":10,\\"trailingSL\\":-1,\\"riskPercent\\":1},\\"target\\":{\\"type\\":\\"Trailing Target\\",\\"profitPercent\\":2,\\"riskRewardRatio\\":2,\\"partialExit\\":100,\\"trailingTarget\\":-1},\\"tradeAction\\":{\\"action\\":\\"Long\\",\\"orderType\\":\\"SL-Market\\",\\"bufferPercent\\":0.1,\\"candlePriceType\\":\\"high\\"},\\"riskManagement\\":{\\"riskPerTrade\\":1,\\"killSwitch\\":false,\\"maxOpenPositions\\":3,\\"maxDailyLoss\\":-1,\\"maxDailyProfit\\":-1,\\"capitalAllocation\\":-1,\\"misMarginRate\\":-1},\\"conditions\\":[]}","createdAt":"2026-06-16T12:59:09.893Z","updatedAt":"2026-06-24T17:57:55.343Z"},"productType":{"id":"prod-algo","name":"Algo","createdAt":"2026-06-22T01:06:32.766Z","updatedAt":"2026-06-24T17:57:53.522Z"}}',
      createdAt: new Date('2026-06-24T20:09:56.981Z')
    },
    create: {
      id: '52cd7a79-bff3-4168-9012-147758f28fd1',
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Kite Token Disconnected',
      oldValue: null,
      newValue: 'Disconnected active Kite session token for Vikash sharma | Endpoint: PUT /api/clients/b364d72f-e2e2-4dbc-bbef-3286c75e1875 | Payload: {"accessToken":null} | Response: {"id":"b364d72f-e2e2-4dbc-bbef-3286c75e1875","userId":"846d4c97-be94-4a06-a72c-c048daf71e3c","zerodhaClientId":"RZJ500","accessToken":null,"capital":"100000","strategyId":"c7bafa89-3403-44c3-bcd0-199602c878e1","tradingStatus":"active","subscriptionStatus":"active","createdAt":"2026-06-13T07:58:14.215Z","updatedAt":"2026-06-24T20:09:55.187Z","zerodhaApiKey":"4y7j026qyv9lkacw","zerodhaApiSecret":"xr2qwbkkn0kj8gbuzuwyn19ggxlxgye9","zerodhaSession":null,"zerodhaPassword":"987654321","zerodhaTotpSecret":"JT5PXX4UOZZYNHTV7X525T6QSA4QNQDQ","aadhaarNumber":"","dob":"","kycStatus":"verified","panNumber":"","productTypeId":"prod-algo","user":{"id":"846d4c97-be94-4a06-a72c-c048daf71e3c","name":"Vikash sharma","email":"vikash@gmail.com","mobile":null,"userId":"vikashsharma162","password":"grw_QyWf8D2n","role":"client","status":"active","createdAt":"2026-06-13T07:58:14.195Z","updatedAt":"2026-06-24T19:11:35.982Z"},"strategy":{"id":"c7bafa89-3403-44c3-bcd0-199602c878e1","name":"Pre-Open Momentum Breakout","description":"Pre-Open Momentum Breakout Strategy","status":"active","configJson":"{\\"basicInfo\\":{\\"name\\":\\"Pre-Open Momentum Breakout\\",\\"status\\":\\"active\\",\\"segment\\":\\"NSE F&O\\",\\"exchange\\":\\"NSE\\",\\"entryTime\\":\\"09:20:30\\",\\"preSelectTime\\":\\"09:15:30\\",\\"selectPosition\\":1,\\"tradeType\\":\\"Intraday\\",\\"timeframe\\":\\"5m\\",\\"checkIntervalSec\\":60,\\"description\\":\\"Pre-Open Momentum Breakout Strategy\\",\\"exitTime\\":\\"15:24:00\\"},\\"stoploss\\":{\\"type\\":\\"Trailing SL\\",\\"orderType\\":\\"Market\\",\\"fixedPercent\\":1,\\"fixedPoints\\":10,\\"trailingSL\\":-1,\\"riskPercent\\":1},\\"target\\":{\\"type\\":\\"Trailing Target\\",\\"profitPercent\\":2,\\"riskRewardRatio\\":2,\\"partialExit\\":100,\\"trailingTarget\\":-1},\\"tradeAction\\":{\\"action\\":\\"Long\\",\\"orderType\\":\\"SL-Market\\",\\"bufferPercent\\":0.1,\\"candlePriceType\\":\\"high\\"},\\"riskManagement\\":{\\"riskPerTrade\\":1,\\"killSwitch\\":false,\\"maxOpenPositions\\":3,\\"maxDailyLoss\\":-1,\\"maxDailyProfit\\":-1,\\"capitalAllocation\\":-1,\\"misMarginRate\\":-1},\\"conditions\\":[]}","createdAt":"2026-06-16T12:59:09.893Z","updatedAt":"2026-06-24T17:57:55.343Z"},"productType":{"id":"prod-algo","name":"Algo","createdAt":"2026-06-22T01:06:32.766Z","updatedAt":"2026-06-24T17:57:53.522Z"}}',
      createdAt: new Date('2026-06-24T20:09:56.981Z')
    },
  });
  await prisma.auditLog.upsert({
    where: { id: 'ca7d5eea-cd18-47bf-9824-d8bc3d6393c8' },
    update: {
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Kite Token Auto-Refreshed',
      oldValue: null,
      newValue: 'Token refreshed for Vikash sharma',
      createdAt: new Date('2026-06-25T02:30:46.166Z')
    },
    create: {
      id: 'ca7d5eea-cd18-47bf-9824-d8bc3d6393c8',
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Kite Token Auto-Refreshed',
      oldValue: null,
      newValue: 'Token refreshed for Vikash sharma',
      createdAt: new Date('2026-06-25T02:30:46.166Z')
    },
  });
  await prisma.auditLog.upsert({
    where: { id: '254c0a7a-0702-4f28-866f-1fde62b409cb' },
    update: {
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Kite Token Auto-Refreshed',
      oldValue: null,
      newValue: 'Token refreshed for Vikash sharma',
      createdAt: new Date('2026-06-25T02:31:03.841Z')
    },
    create: {
      id: '254c0a7a-0702-4f28-866f-1fde62b409cb',
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Kite Token Auto-Refreshed',
      oldValue: null,
      newValue: 'Token refreshed for Vikash sharma',
      createdAt: new Date('2026-06-25T02:31:03.841Z')
    },
  });
  await prisma.auditLog.upsert({
    where: { id: 'd3f1e743-f744-4986-81c7-79de55b138c9' },
    update: {
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Kite Token Auto-Refreshed',
      oldValue: null,
      newValue: 'Token refreshed for Vikash sharma',
      createdAt: new Date('2026-06-25T03:50:12.706Z')
    },
    create: {
      id: 'd3f1e743-f744-4986-81c7-79de55b138c9',
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Kite Token Auto-Refreshed',
      oldValue: null,
      newValue: 'Token refreshed for Vikash sharma',
      createdAt: new Date('2026-06-25T03:50:12.706Z')
    },
  });
  await prisma.auditLog.upsert({
    where: { id: '165a378a-5c2f-4ba6-b218-ccfdfe74bb5b' },
    update: {
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Kite Token Auto-Refreshed',
      oldValue: null,
      newValue: 'Token refreshed for Vikash sharma',
      createdAt: new Date('2026-06-25T23:36:06.393Z')
    },
    create: {
      id: '165a378a-5c2f-4ba6-b218-ccfdfe74bb5b',
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Kite Token Auto-Refreshed',
      oldValue: null,
      newValue: 'Token refreshed for Vikash sharma',
      createdAt: new Date('2026-06-25T23:36:06.393Z')
    },
  });
  await prisma.auditLog.upsert({
    where: { id: 'dee05d81-bc55-4be8-9063-4af50aa94ea9' },
    update: {
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Kite Token Auto-Refreshed',
      oldValue: null,
      newValue: 'Token refreshed for Vikash sharma',
      createdAt: new Date('2026-06-26T01:04:49.105Z')
    },
    create: {
      id: 'dee05d81-bc55-4be8-9063-4af50aa94ea9',
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Kite Token Auto-Refreshed',
      oldValue: null,
      newValue: 'Token refreshed for Vikash sharma',
      createdAt: new Date('2026-06-26T01:04:49.105Z')
    },
  });
  await prisma.auditLog.upsert({
    where: { id: '26413362-628c-4128-8f9a-559392ce4395' },
    update: {
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Kite Token Auto-Refreshed',
      oldValue: null,
      newValue: 'Token refreshed for Vikash sharma',
      createdAt: new Date('2026-06-26T02:30:37.497Z')
    },
    create: {
      id: '26413362-628c-4128-8f9a-559392ce4395',
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Kite Token Auto-Refreshed',
      oldValue: null,
      newValue: 'Token refreshed for Vikash sharma',
      createdAt: new Date('2026-06-26T02:30:37.497Z')
    },
  });
  await prisma.auditLog.upsert({
    where: { id: '7b74d3b2-f9db-47f9-a948-a5413d78520a' },
    update: {
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Kite Token Auto-Refreshed',
      oldValue: null,
      newValue: 'Token refreshed for Vikash sharma',
      createdAt: new Date('2026-06-27T03:32:36.576Z')
    },
    create: {
      id: '7b74d3b2-f9db-47f9-a948-a5413d78520a',
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Kite Token Auto-Refreshed',
      oldValue: null,
      newValue: 'Token refreshed for Vikash sharma',
      createdAt: new Date('2026-06-27T03:32:36.576Z')
    },
  });
  await prisma.auditLog.upsert({
    where: { id: '544eda35-f5a3-4999-86d7-ae5b700ff2bc' },
    update: {
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Kite Token Auto-Refreshed',
      oldValue: null,
      newValue: 'Token refreshed for Vikash sharma',
      createdAt: new Date('2026-06-27T23:43:39.283Z')
    },
    create: {
      id: '544eda35-f5a3-4999-86d7-ae5b700ff2bc',
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Kite Token Auto-Refreshed',
      oldValue: null,
      newValue: 'Token refreshed for Vikash sharma',
      createdAt: new Date('2026-06-27T23:43:39.283Z')
    },
  });
  await prisma.auditLog.upsert({
    where: { id: '51853ed2-d640-47dd-98ee-be8a1862af83' },
    update: {
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Kite Token Auto-Refreshed',
      oldValue: null,
      newValue: 'Token refreshed for Vikash sharma',
      createdAt: new Date('2026-06-28T02:16:05.497Z')
    },
    create: {
      id: '51853ed2-d640-47dd-98ee-be8a1862af83',
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Kite Token Auto-Refreshed',
      oldValue: null,
      newValue: 'Token refreshed for Vikash sharma',
      createdAt: new Date('2026-06-28T02:16:05.497Z')
    },
  });
  await prisma.auditLog.upsert({
    where: { id: '2e1b679c-ae0a-4e27-8cb2-ba3a62dc84b9' },
    update: {
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Kite Token Auto-Refreshed',
      oldValue: null,
      newValue: 'Token refreshed for Vikash sharma',
      createdAt: new Date('2026-06-28T02:30:05.931Z')
    },
    create: {
      id: '2e1b679c-ae0a-4e27-8cb2-ba3a62dc84b9',
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Kite Token Auto-Refreshed',
      oldValue: null,
      newValue: 'Token refreshed for Vikash sharma',
      createdAt: new Date('2026-06-28T02:30:05.931Z')
    },
  });
  await prisma.auditLog.upsert({
    where: { id: '5e9f02e1-2b9f-4187-af5b-176be2948ebb' },
    update: {
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Kite Token Auto-Refreshed',
      oldValue: null,
      newValue: 'Token refreshed for Vikash sharma',
      createdAt: new Date('2026-06-29T02:54:00.443Z')
    },
    create: {
      id: '5e9f02e1-2b9f-4187-af5b-176be2948ebb',
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Kite Token Auto-Refreshed',
      oldValue: null,
      newValue: 'Token refreshed for Vikash sharma',
      createdAt: new Date('2026-06-29T02:54:00.443Z')
    },
  });
  await prisma.auditLog.upsert({
    where: { id: '33ed6dfe-3a08-4dd1-9150-abc637c87391' },
    update: {
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Kite Token Auto-Refreshed',
      oldValue: null,
      newValue: 'Token refreshed for Vikash sharma',
      createdAt: new Date('2026-06-29T03:50:12.580Z')
    },
    create: {
      id: '33ed6dfe-3a08-4dd1-9150-abc637c87391',
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'Kite Token Auto-Refreshed',
      oldValue: null,
      newValue: 'Token refreshed for Vikash sharma',
      createdAt: new Date('2026-06-29T03:50:12.580Z')
    },
  });
  await prisma.auditLog.upsert({
    where: { id: '3b47572d-eb73-475c-b007-16515391033a' },
    update: {
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'AUTO TRADE INITIATED',
      oldValue: null,
      newValue: 'Client: Vikash sharma | Strategy: Pre-Open Momentum Breakout | Stock: PERSISTENT | Qty: 7 | Entry: 4496.50',
      createdAt: new Date('2026-06-29T03:51:15.351Z')
    },
    create: {
      id: '3b47572d-eb73-475c-b007-16515391033a',
      adminId: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      action: 'AUTO TRADE INITIATED',
      oldValue: null,
      newValue: 'Client: Vikash sharma | Strategy: Pre-Open Momentum Breakout | Stock: PERSISTENT | Qty: 7 | Entry: 4496.50',
      createdAt: new Date('2026-06-29T03:51:15.351Z')
    },
  });
  console.log('auditLog: 22');


  console.log('\n✅ Neon data seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
