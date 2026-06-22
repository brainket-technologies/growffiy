import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import dotenv from 'dotenv';
import ws from 'ws';

dotenv.config();

global.WebSocket = ws as any;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding exact Neon data...');

  // ──────────────────────────────────────────────
  // 1. Product Types
  // ──────────────────────────────────────────────
  const prodAlgo = await prisma.productType.upsert({
    where: { id: 'prod-algo' },
    update: { name: 'Algo' },
    create: { id: 'prod-algo', name: 'Algo' }
  });
  console.log('ProductType:', prodAlgo.id);

  const prodScanner = await prisma.productType.upsert({
    where: { id: 'prod-scanner' },
    update: { name: 'Scanner' },
    create: { id: 'prod-scanner', name: 'Scanner' }
  });
  console.log('ProductType:', prodScanner.id);

  // ──────────────────────────────────────────────
  // 2. Users
  // ──────────────────────────────────────────────
  const userVikash = await prisma.user.upsert({
    where: { email: 'vikash@gmail.com' },
    update: {
      name: 'Vikash sharma',
      userId: 'vikashsharma162',
      password: 'grw_QyWf8D2n',
      role: 'client',
      status: 'active'
    },
    create: {
      id: '846d4c97-be94-4a06-a72c-c048daf71e3c',
      name: 'Vikash sharma',
      email: 'vikash@gmail.com',
      userId: 'vikashsharma162',
      password: 'grw_QyWf8D2n',
      role: 'client',
      status: 'active'
    }
  });
  console.log('User:', userVikash.email);

  const userFiroz = await prisma.user.upsert({
    where: { email: 'firoz@gmail.com' },
    update: {
      name: 'Firoz Mohammad',
      userId: 'firoz',
      password: '123',
      role: 'admin',
      status: 'active'
    },
    create: {
      id: 'dd7cb114-8fd4-457c-a963-9318188a1e8e',
      name: 'Firoz Mohammad',
      email: 'firoz@gmail.com',
      userId: 'firoz',
      password: '123',
      role: 'admin',
      status: 'active'
    }
  });
  console.log('User:', userFiroz.email);

  // ──────────────────────────────────────────────
  // 3. Strategy
  // ──────────────────────────────────────────────
  const strategyConfig = {
    basicInfo: {
      name: 'Pre-Open Momentum Breakout',
      status: 'active',
      segment: 'NSE F&O',
      exchange: 'NSE',
      entryTime: '09:20:30',
      preSelectTime: '09:15:30',
      selectPosition: 1,
      tradeType: 'Intraday',
      timeframe: '5m',
      checkIntervalSec: 60,
      description: 'Pre-Open Momentum Breakout Strategy',
      exitTime: '15:25'
    },
    stoploss: {
      type: 'Trailing SL',
      orderType: 'Market',
      fixedPercent: 1,
      fixedPoints: 10,
      trailingSL: -1,
      riskPercent: 1
    },
    target: {
      type: 'Trailing Target',
      profitPercent: 2,
      riskRewardRatio: 2,
      partialExit: 100,
      trailingTarget: -1
    },
    tradeAction: {
      action: 'Long',
      orderType: 'SL-Market',
      bufferPercent: 0.1,
      candlePriceType: 'high'
    },
    riskManagement: {
      riskPerTrade: 3,
      killSwitch: false,
      maxOpenPositions: 3,
      maxDailyLoss: -1,
      maxDailyProfit: -1,
      capitalAllocation: 10,
      misMarginRate: -1
    },
    conditions: []
  };

  const strategy = await prisma.strategy.upsert({
    where: { id: 'c7bafa89-3403-44c3-bcd0-199602c878e1' },
    update: {
      name: 'Pre-Open Momentum Breakout',
      description: 'Pre-Open Momentum Breakout Strategy',
      status: 'active',
      configJson: JSON.stringify(strategyConfig)
    },
    create: {
      id: 'c7bafa89-3403-44c3-bcd0-199602c878e1',
      name: 'Pre-Open Momentum Breakout',
      description: 'Pre-Open Momentum Breakout Strategy',
      status: 'active',
      configJson: JSON.stringify(strategyConfig)
    }
  });
  console.log('Strategy:', strategy.id);

  // ──────────────────────────────────────────────
  // 4. Client
  // ──────────────────────────────────────────────
  const client = await prisma.client.upsert({
    where: { id: 'b364d72f-e2e2-4dbc-bbef-3286c75e1875' },
    update: {
      userId: userVikash.id,
      zerodhaClientId: 'RZJ500',
      accessToken: 'bQTr62YaMJU7CrtmyLGMyLchq6Cdi9wi',
      capital: '500000',
      strategyId: strategy.id,
      tradingStatus: 'active',
      subscriptionStatus: 'active',
      zerodhaApiKey: '4y7j026qyv9lkacw',
      zerodhaApiSecret: 'xr2qwbkkn0kj8gbuzuwyn19ggxlxgye9',
      zerodhaSession: '{"user_type":"individual/ind_with_nom","email":"js9650141@gmail.com","user_name":"Janvi Sharma","user_shortname":"Janvi","broker":"ZERODHA","exchanges":["BSE","MF","NSE"],"products":["CNC","NRML","MIS","BO","CO"],"order_types":["MARKET","LIMIT","SL","SL-M"],"avatar_url":null,"user_id":"RZJ500","api_key":"4y7j026qyv9lkacw","access_token":"bQTr62YaMJU7CrtmyLGMyLchq6Cdi9wi","public_token":"TPkQFecFWqYZfDdREfzXazBcRx3gDdlD","refresh_token":"","enctoken":"jsLJJd5Zrs/SR+cfw5udsdXZA4pbNolnv3PLRrW6Fvl+rGLsp+eHWSTOwJzvbeIa6mDAnYnl5xnat9JHxfxvqPIjcBsIvbLrphm2rqAnmyWKYXLO94faU+r3a0TWhRM=","login_time":"2026-06-22 05:01:30","meta":{"demat_consent":"consent"}}',
      zerodhaPassword: '987654321',
      zerodhaTotpSecret: 'JT5PXX4UOZZYNHTV7X525T6QSA4QNQDQ',
      aadhaarNumber: '',
      dob: '',
      kycStatus: 'verified',
      panNumber: '',
      productTypeId: prodAlgo.id
    },
    create: {
      id: 'b364d72f-e2e2-4dbc-bbef-3286c75e1875',
      userId: userVikash.id,
      zerodhaClientId: 'RZJ500',
      accessToken: 'bQTr62YaMJU7CrtmyLGMyLchq6Cdi9wi',
      capital: '500000',
      strategyId: strategy.id,
      tradingStatus: 'active',
      subscriptionStatus: 'active',
      zerodhaApiKey: '4y7j026qyv9lkacw',
      zerodhaApiSecret: 'xr2qwbkkn0kj8gbuzuwyn19ggxlxgye9',
      zerodhaSession: '{"user_type":"individual/ind_with_nom","email":"js9650141@gmail.com","user_name":"Janvi Sharma","user_shortname":"Janvi","broker":"ZERODHA","exchanges":["BSE","MF","NSE"],"products":["CNC","NRML","MIS","BO","CO"],"order_types":["MARKET","LIMIT","SL","SL-M"],"avatar_url":null,"user_id":"RZJ500","api_key":"4y7j026qyv9lkacw","access_token":"bQTr62YaMJU7CrtmyLGMyLchq6Cdi9wi","public_token":"TPkQFecFWqYZfDdREfzXazBcRx3gDdlD","refresh_token":"","enctoken":"jsLJJd5Zrs/SR+cfw5udsdXZA4pbNolnv3PLRrW6Fvl+rGLsp+eHWSTOwJzvbeIa6mDAnYnl5xnat9JHxfxvqPIjcBsIvbLrphm2rqAnmyWKYXLO94faU+r3a0TWhRM=","login_time":"2026-06-22 05:01:30","meta":{"demat_consent":"consent"}}',
      zerodhaPassword: '987654321',
      zerodhaTotpSecret: 'JT5PXX4UOZZYNHTV7X525T6QSA4QNQDQ',
      aadhaarNumber: '',
      dob: '',
      kycStatus: 'verified',
      panNumber: '',
      productTypeId: prodAlgo.id
    }
  });
  console.log('Client:', client.id);

  // ──────────────────────────────────────────────
  // 5. Subscription Plans
  // ──────────────────────────────────────────────
  const plans = [
    { id: '73a18efe-9128-49dc-b658-6147133698b9', name: 'Algo Monthly Plan', price: 4999, durationDays: 30, features: '["Pre-Open Momentum Strategy","1% Capital Risk Guard","Zerodha Kite API Integration","Live Performance Dashboard","Email Support (48hr SLA)"]', productTypeId: prodAlgo.id },
    { id: '5520ea32-3f93-4577-8e9a-8e77d0a72ffa', name: 'Algo Quarterly Plan', price: 12999, durationDays: 90, features: '["Everything in Monthly","Telegram Trade Alerts","Priority API Setup Assistance","1:3 Risk-Reward Configuration","Priority Support (12hr SLA)"]', productTypeId: prodAlgo.id },
    { id: 'bdf048df-ef68-4118-a9df-90b5eb974b8a', name: 'Algo Yearly Plan', price: 39999, durationDays: 365, features: '["Everything in Quarterly","Dedicated Account Manager","Custom Strategy Parameters","Emergency Kill Switch Access","24/7 Phone Support"]', productTypeId: prodAlgo.id },
    { id: '867bcedb-6cfa-4f6c-b08b-283f1d8087e5', name: 'Scanner Monthly Plan', price: 1999, durationDays: 30, features: '["Live Momentum Scanners","Multi-Indicator Alerts","Custom Watchlist Scans","Email Support (48hr SLA)"]', productTypeId: prodScanner.id },
    { id: '6e547451-dcb7-4abe-ad50-320d7a09978b', name: 'Scanner Quarterly Plan', price: 4999, durationDays: 90, features: '["Everything in Monthly","Telegram Alert Webhooks","Unlimited Scans Per Day","Priority Support (12hr SLA)"]', productTypeId: prodScanner.id },
    { id: 'bac29e96-8de1-4d0b-8e80-7e3f750d8b1d', name: 'Scanner Yearly Plan', price: 14999, durationDays: 365, features: '["Everything in Quarterly","Custom Scanner Python API","24/7 Phone Support"]', productTypeId: prodScanner.id },
  ];

  for (const p of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { id: p.id },
      update: { name: p.name, price: p.price, durationDays: p.durationDays, features: p.features, status: 'active', productTypeId: p.productTypeId },
      create: { id: p.id, name: p.name, price: p.price, durationDays: p.durationDays, features: p.features, status: 'active', productTypeId: p.productTypeId }
    });
  }
  console.log('SubscriptionPlans: 6');

  // ──────────────────────────────────────────────
  // 6. App Settings
  // ──────────────────────────────────────────────
  const appSettings = [
    { id: '2eb3fc15-3e89-4d13-91e4-842417c3810e', settingKey: 'smtp_encryption', settingValue: 'tls', type: 'string' },
    { id: '87594b21-70bb-44d5-85df-ca3042dd30e8', settingKey: 'smtp_status', settingValue: 'false', type: 'string' },
    { id: '3c7d6b7f-c7f1-4026-9695-c35e01b9cdb8', settingKey: 'support_email', settingValue: 'support@growffiy.com', type: 'string' },
    { id: '31244e8c-378c-4b9e-b94a-fabd7e1e94e2', settingKey: 'algo_entry_time', settingValue: '09:20:30', type: 'string' },
    { id: '000cbf6f-4f56-4478-bac4-4dc41385d23b', settingKey: 'support_phone', settingValue: '+91 9026663052', type: 'string' },
    { id: '9895f66a-2049-4d51-85f3-2dd78e358c57', settingKey: 'algo_check_interval_sec', settingValue: '60', type: 'string' },
    { id: '3813bc5c-1170-4b6c-b7eb-6b27c9947c84', settingKey: 'isTradingActive', settingValue: 'true', type: 'boolean' },
    { id: '08dd1962-7f47-4a38-bc25-bec4783249b7', settingKey: 'support_timings', settingValue: 'Live Chat (Mon-Fri, 9:00 AM - 3:30 PM)', type: 'string' },
    { id: '4b9fe07a-a46a-4ba3-b1ee-4635ac483e75', settingKey: 'PRE_OPEN_QUOTES_DATA', settingValue: '{"quotes":[]}', type: 'json' },
    { id: 'da2a7128-b9d3-4083-ab10-fc86227f748a', settingKey: 'algo_preopen_fetch_time', settingValue: '09:08', type: 'string' },
    { id: 'b044cde0-d7f8-4c2a-bc99-a209f8296cda', settingKey: 'algo_token_refresh_time', settingValue: '08:00', type: 'string' },
    { id: '16ded507-6030-478a-8ca6-de6f76348a2a', settingKey: 'auto_trade_enabled', settingValue: 'true', type: 'string' },
    { id: 'c81ddaab-b729-4732-ad24-bd42e50d0ede', settingKey: 'trading_days', settingValue: '["Mon","Tue","Wed","Thu","Fri"]', type: 'string' },
    { id: 'f8cceaea-59a0-47c2-8a77-cf91f569f463', settingKey: 'special_market_days', settingValue: '[]', type: 'string' },
    { id: '915db754-9bfd-45ec-a780-776834c8d681', settingKey: 'market_holidays', settingValue: '[{"date":"2026-06-26","name":"Muharram"}]', type: 'string' },
    { id: '3cd6d731-646b-41e0-9b02-eb7d238cea4e', settingKey: 'app_name', settingValue: 'Growffi', type: 'string' },
    { id: '0daab40f-3239-432d-8d3c-0388fd7062f4', settingKey: 'app_title', settingValue: 'Growffiy — ', type: 'string' },
    { id: '248a11d6-03e0-4982-81e9-6ba91f59ba6c', settingKey: 'app_favicon', settingValue: '', type: 'string' },
    { id: '2e8ea13a-bd1b-4439-b744-aa4fa56091c0', settingKey: 'app_logo', settingValue: '', type: 'string' },
    { id: 'bbf12f03-e575-42a6-ac18-f398aa63c110', settingKey: 'meta_description', settingValue: 'afldhf', type: 'string' },
    { id: '0b353118-0eec-4cdc-ab32-1a401169a7cf', settingKey: 'meta_keywords', settingValue: 'dfla', type: 'string' },
    { id: '7cfe80b5-de1e-4248-86ee-5c1c5159fa75', settingKey: 'footer_text', settingValue: 'fdflahf', type: 'string' },
    { id: 'd0c1cd6c-43b0-4e00-8564-e273e339d67b', settingKey: 'google_analytics_id', settingValue: 'fdajf', type: 'string' },
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
  ];

  for (const s of appSettings) {
    await prisma.appSettings.upsert({
      where: { id: s.id },
      update: { settingKey: s.settingKey, settingValue: s.settingValue, type: s.type },
      create: { id: s.id, settingKey: s.settingKey, settingValue: s.settingValue, type: s.type }
    });
  }
  console.log('AppSettings: 33');

  // ──────────────────────────────────────────────
  // 7. Subscription
  // ──────────────────────────────────────────────
  await prisma.subscription.upsert({
    where: { id: 'c3f8dbc4-b90b-49c3-99da-ab6a2bd1c5a4' },
    update: {
      userId: userVikash.id,
      planId: '73a18efe-9128-49dc-b658-6147133698b9',
      startDate: new Date('2026-06-21T23:11:06.603Z'),
      endDate: new Date('2026-07-21T23:11:06.603Z'),
      status: 'active'
    },
    create: {
      id: 'c3f8dbc4-b90b-49c3-99da-ab6a2bd1c5a4',
      userId: userVikash.id,
      planId: '73a18efe-9128-49dc-b658-6147133698b9',
      startDate: new Date('2026-06-21T23:11:06.603Z'),
      endDate: new Date('2026-07-21T23:11:06.603Z'),
      status: 'active'
    }
  });
  console.log('Subscription: 1');

  // ──────────────────────────────────────────────
  // 8. Payment
  // ──────────────────────────────────────────────
  await prisma.payment.upsert({
    where: { id: '5bfc219b-d1ce-45f6-b5f4-91fa3f5096bd' },
    update: {
      userId: userVikash.id,
      planId: '73a18efe-9128-49dc-b658-6147133698b9',
      amount: 4999,
      razorpayOrderId: 'order_T4SRKLgGO23GOz',
      razorpayPaymentId: 'pay_T4SRY7IpT4xup4',
      status: 'success',
      paymentDate: new Date('2026-06-21T23:11:06.353Z')
    },
    create: {
      id: '5bfc219b-d1ce-45f6-b5f4-91fa3f5096bd',
      userId: userVikash.id,
      planId: '73a18efe-9128-49dc-b658-6147133698b9',
      amount: 4999,
      razorpayOrderId: 'order_T4SRKLgGO23GOz',
      razorpayPaymentId: 'pay_T4SRY7IpT4xup4',
      status: 'success',
      paymentDate: new Date('2026-06-21T23:11:06.353Z')
    }
  });
  console.log('Payment: 1');

  // ──────────────────────────────────────────────
  // 9. Support Ticket
  // ──────────────────────────────────────────────
  await prisma.supportTicket.upsert({
    where: { id: '514dff3f-be17-4fec-9b32-b288988fb105' },
    update: {
      userId: userVikash.id,
      subject: 'hfkh',
      message: 'dfaldhf',
      category: 'General',
      status: 'resolved',
      reply: null
    },
    create: {
      id: '514dff3f-be17-4fec-9b32-b288988fb105',
      userId: userVikash.id,
      subject: 'hfkh',
      message: 'dfaldhf',
      category: 'General',
      status: 'resolved',
      reply: null
    }
  });
  console.log('SupportTicket: 1');

  // ──────────────────────────────────────────────
  // 10. Strategy Assignments
  // ──────────────────────────────────────────────
  const assignments = [
    { id: '6b5595d6-7181-4b8d-9d88-f61563603bb6', clientId: client.id, strategyId: strategy.id, status: 'active' },
    { id: '81977e6e-88cb-4f5a-a0cc-96fb67673a25', clientId: client.id, strategyId: strategy.id, status: 'active' },
    { id: 'efbd6895-f105-41c1-81f2-6cd1f06f557a', clientId: client.id, strategyId: strategy.id, status: 'active' },
  ];
  for (const a of assignments) {
    await prisma.strategyAssignment.upsert({
      where: { id: a.id },
      update: { clientId: a.clientId, strategyId: a.strategyId, status: a.status },
      create: { id: a.id, clientId: a.clientId, strategyId: a.strategyId, status: a.status }
    });
  }
  console.log('StrategyAssignments: 3');

  // ──────────────────────────────────────────────
  // 11. Strategy Logs
  // ──────────────────────────────────────────────
  const strategyLogs = [
    { id: '12c48757-969a-434f-acea-021e3bbca268', strategyId: strategy.id, message: 'Strategy configuration updated.', logType: 'info', createdAt: new Date('2026-06-16T14:10:57.437Z') },
    { id: 'cdfdec00-963b-4162-babb-9f0f81b92d7d', strategyId: strategy.id, message: 'Client b364d72f-e2e2-4dbc-bbef-3286c75e1875 assigned to strategy.', logType: 'info', createdAt: new Date('2026-06-16T18:20:03.110Z') },
    { id: 'e1c62193-bd8d-4f66-9f61-90353acbc3d0', strategyId: strategy.id, message: 'Client b364d72f-e2e2-4dbc-bbef-3286c75e1875 assigned to strategy.', logType: 'info', createdAt: new Date('2026-06-16T18:20:10.582Z') },
    { id: '008ee260-460b-4d60-88d4-f495e8f4ef1e', strategyId: strategy.id, message: 'Client b364d72f-e2e2-4dbc-bbef-3286c75e1875 assigned to strategy.', logType: 'info', createdAt: new Date('2026-06-16T18:20:15.192Z') },
    { id: '5da24d33-dc1d-4a08-a9b9-8de062b513f6', strategyId: strategy.id, message: 'Intraday Trade Initiated for Vikash sharma: Bought 1 shares of VAML at entry price ₹471.11 using config from DB strategy "Pre Open Momentum Breakout". Capital allocated (1%): ₹500.00. Target: ₹478.18 (1.5%), Stop Loss: ₹468.75 (0.5%).', logType: 'trade', createdAt: new Date('2026-06-16T18:31:47.437Z') },
    { id: '988b766f-06b3-43dc-8c81-3a2823d66e17', strategyId: strategy.id, message: 'Kite order failed for Vikash sharma: Zerodha API returned error status. Trade aborted.', logType: 'error', createdAt: new Date('2026-06-16T18:39:19.598Z') },
    { id: '481c5d9a-edff-4043-abbc-150652efdec1', strategyId: strategy.id, message: 'Kite order failed for Vikash sharma: Zerodha API returned error status. Trade aborted.', logType: 'error', createdAt: new Date('2026-06-16T18:48:33.941Z') },
    { id: 'c330337b-2647-40ef-9113-a700ea565bfc', strategyId: strategy.id, message: 'Kite order failed for Vikash sharma: Zerodha API returned error status. Trade aborted.', logType: 'error', createdAt: new Date('2026-06-16T19:46:36.841Z') },
    { id: '7ebf171e-4f99-45b2-be88-f5625d0b41da', strategyId: strategy.id, message: 'Kite order failed for Vikash sharma: IP (3.86.244.195) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip', logType: 'error', createdAt: new Date('2026-06-16T19:56:23.220Z') },
    { id: '8b6628ab-5cb7-40b0-aa38-4dc495a8c573', strategyId: strategy.id, message: 'Kite order failed for Vikash sharma: IP (100.26.48.193) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip', logType: 'error', createdAt: new Date('2026-06-16T19:57:36.308Z') },
    { id: '43f15089-10fb-4939-9836-50e84193b980', strategyId: strategy.id, message: 'Kite order failed for Vikash sharma: IP (44.192.70.209) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip', logType: 'error', createdAt: new Date('2026-06-16T19:59:03.339Z') },
    { id: '529b6384-6f29-444f-949b-e38ad86475cf', strategyId: strategy.id, message: 'Kite order failed for Vikash sharma: IP (100.58.222.232) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip', logType: 'error', createdAt: new Date('2026-06-17T19:41:35.122Z') },
    { id: '6c723938-8fc0-4387-a4c3-bc1ebcbb425f', strategyId: strategy.id, message: 'Kite order failed for Vikash sharma: IP (32.192.52.0) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip', logType: 'error', createdAt: new Date('2026-06-17T19:44:30.100Z') },
    { id: 'f8653bb3-b34c-4a84-8353-13521ae1282a', strategyId: strategy.id, message: 'Kite order failed for Vikash sharma: IP (23.20.22.105) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip', logType: 'error', createdAt: new Date('2026-06-17T20:02:42.736Z') },
    { id: '3559e1dd-45fb-4327-9f3e-26ffd58ad39f', strategyId: strategy.id, message: 'Kite order failed for Vikash sharma: IP (44.203.201.11) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip', logType: 'error', createdAt: new Date('2026-06-17T20:07:14.338Z') },
    { id: 'c209a0bb-77c6-4316-be1d-ab073e974d42', strategyId: strategy.id, message: 'Kite order failed for Vikash sharma: IP (54.209.77.35) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip', logType: 'error', createdAt: new Date('2026-06-17T20:13:44.201Z') },
    { id: '04800d18-3f4f-45de-9cf9-1bf5ef0b01ec', strategyId: strategy.id, message: 'Kite order failed for Vikash sharma: Market orders without market protection are not allowed via API. Please set market protection or use a Limit order.', logType: 'error', createdAt: new Date('2026-06-17T20:29:25.094Z') },
    { id: '0a5f7ce8-1924-41db-912c-66ca728c6878', strategyId: strategy.id, message: 'Kite order failed for Vikash sharma: Market orders without market protection are not allowed via API. Please set market protection or use a Limit order.', logType: 'error', createdAt: new Date('2026-06-17T20:36:07.261Z') },
    { id: '1dc986a7-adfd-46b2-b4ab-efe1f4d6657b', strategyId: strategy.id, message: 'Kite order failed for Vikash sharma: Market orders without market protection are not allowed via API. Please set market protection or use a Limit order.', logType: 'error', createdAt: new Date('2026-06-17T20:41:59.316Z') },
    { id: '4960f39f-c821-49fc-bd70-9dd67f122b6f', strategyId: strategy.id, message: 'Kite order failed for Vikash sharma: Market orders without market protection are not allowed via API. Please set market protection or use a Limit order.', logType: 'error', createdAt: new Date('2026-06-17T20:45:26.815Z') },
    { id: '4eac0c0e-69d0-4cd7-b172-1ae3578ea496', strategyId: strategy.id, message: 'Kite order failed for Vikash sharma: Market orders without market protection are not allowed via API. Please set market protection or use a Limit order.', logType: 'error', createdAt: new Date('2026-06-17T20:46:06.198Z') },
    { id: '305ebca1-49f0-41cf-bfc6-0935ddb000b4', strategyId: strategy.id, message: 'Kite order failed for Vikash sharma: Market orders without market protection are not allowed via API. Please set market protection or use a Limit order.', logType: 'error', createdAt: new Date('2026-06-17T20:48:11.575Z') },
    { id: '59c5e527-453d-4ee3-99f3-bf0d098e9efd', strategyId: strategy.id, message: 'Kite order failed for Vikash sharma: Your order could not be converted to a After Market Order (AMO).', logType: 'error', createdAt: new Date('2026-06-17T21:01:51.354Z') },
    { id: '94a603f1-8e84-4d8f-b764-dc557ee6cc21', strategyId: strategy.id, message: 'Kite order failed for Vikash sharma: IP (2405:201:6011:f874:1968:4b6e:d659:3398) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip', logType: 'error', createdAt: new Date('2026-06-17T21:04:58.590Z') },
    { id: 'f4aa2e90-160e-45f2-b69b-c35068eb5de1', strategyId: strategy.id, message: 'Kite order failed for Vikash sharma: IP (2405:201:6011:f874:1968:4b6e:d659:3398) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip', logType: 'error', createdAt: new Date('2026-06-17T21:12:43.318Z') },
    { id: '30babe18-dc8e-422a-a366-e051dd3b6cf5', strategyId: strategy.id, message: 'Kite order failed for Vikash sharma: Our order management system is under scheduled maintenance. Try placing your AMO order after 5.30 AM.', logType: 'error', createdAt: new Date('2026-06-17T21:21:36.563Z') },
    { id: '5203d466-3beb-4374-bfc5-8cfd65dad5cc', strategyId: strategy.id, message: 'Kite order failed for Vikash sharma: Incorrect `api_key` or `access_token`.', logType: 'error', createdAt: new Date('2026-06-18T03:45:45.229Z') },
    { id: '7e99e852-830a-4a6e-9d84-67248c5ebccf', strategyId: strategy.id, message: 'Strategy configuration updated.', logType: 'info', createdAt: new Date('2026-06-18T19:12:35.991Z') },
    { id: '5e1b3e4d-f779-435f-82e5-18c4d2697bc4', strategyId: strategy.id, message: 'Strategy configuration updated.', logType: 'info', createdAt: new Date('2026-06-18T19:13:00.811Z') },
    { id: '7939411b-056c-4843-ac8e-752a6a1ec784', strategyId: strategy.id, message: 'Skipped: Calculated quantity is 0 (Allocated amount ₹854.90 is less than entry price ₹3040.24).', logType: 'info', createdAt: new Date('2026-06-19T03:50:43.412Z') },
    { id: 'e13d818c-ee07-4ed0-a295-c2c5869ba736', strategyId: strategy.id, message: 'Strategy configuration updated.', logType: 'info', createdAt: new Date('2026-06-19T16:19:08.859Z') },
    { id: '30a009c0-0609-41f6-a52e-dbe70dc53c65', strategyId: strategy.id, message: 'Strategy configuration updated.', logType: 'info', createdAt: new Date('2026-06-19T18:17:21.512Z') },
    { id: 'ec6dcb76-db19-4b38-bf7b-3dd3b0a5875a', strategyId: strategy.id, message: 'Strategy configuration updated.', logType: 'info', createdAt: new Date('2026-06-19T20:17:46.863Z') },
    { id: 'e67e27e7-7c76-4ff8-8e6f-a2f1810adae2', strategyId: strategy.id, message: 'Client b364d72f-e2e2-4dbc-bbef-3286c75e1875 assigned to strategy.', logType: 'info', createdAt: new Date('2026-06-21T20:39:30.483Z') },
    { id: '16519ddd-3431-49c9-aa87-c082da7b5ba2', strategyId: strategy.id, message: 'Client b364d72f-e2e2-4dbc-bbef-3286c75e1875 assigned to strategy.', logType: 'info', createdAt: new Date('2026-06-21T20:39:31.551Z') },
  ];
  for (const log of strategyLogs) {
    await prisma.strategyLog.upsert({
      where: { id: log.id },
      update: { strategyId: log.strategyId, message: log.message, logType: log.logType, createdAt: log.createdAt },
      create: { id: log.id, strategyId: log.strategyId, message: log.message, logType: log.logType, createdAt: log.createdAt }
    });
  }
  console.log('StrategyLogs: 35');

  // ──────────────────────────────────────────────
  // 12. Trades
  // ──────────────────────────────────────────────
  const trades = [
    {
      id: '61f91710-6cb2-4856-9799-0e0733f1fd5d',
      clientId: client.id,
      strategyId: strategy.id,
      symbol: 'INFY',
      orderType: 'MIS',
      entryPrice: 1142.9,
      stopLoss: 1137.19,
      target: 1160.04,
      quantity: 87,
      status: 'FAILED',
      entryTime: new Date('2026-06-18T03:45:44.954Z'),
      kiteResponse: { data: null, status: 'error', message: 'Incorrect `api_key` or `access_token`.', error_type: 'TokenException' }
    },
    {
      id: '0e8b0e14-0687-4612-bc70-8c2b2f28e5df',
      clientId: client.id,
      strategyId: strategy.id,
      symbol: 'MPHASIS',
      orderType: 'MIS',
      entryPrice: 3040.24,
      quantity: 0,
      status: 'FAILED',
      entryTime: new Date('2026-06-19T03:50:43.150Z'),
      kiteResponse: { message: 'Skipped: Calculated quantity is 0 (Allocated amount ₹854.90 is less than entry price ₹3040.24).' }
    },
    {
      id: 'ebd6e813-126d-4451-8c7a-95a018b3dcad',
      clientId: client.id,
      strategyId: strategy.id,
      symbol: 'TATASTEEL',
      orderType: 'MIS',
      entryPrice: 198,
      stopLoss: 197.01,
      target: 200.97,
      quantity: 7,
      status: 'FAILED',
      entryTime: new Date('2026-06-17T21:21:36.316Z'),
      kiteResponse: { data: null, status: 'error', message: 'Our order management system is under scheduled maintenance. Try placing your AMO order after 5.30 AM.', error_type: 'InputException' }
    },
  ];
  for (const t of trades) {
    await prisma.trade.upsert({
      where: { id: t.id },
      update: t,
      create: t
    });
  }
  console.log('Trades: 3');

  console.log('Seed complete. Exact Neon data restored.');
}

main()
  .catch((e) => {
    console.error('Error seeding DB via Prisma:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
