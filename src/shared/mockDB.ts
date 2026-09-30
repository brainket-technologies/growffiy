export let inMemoryStrategies: any[] = [
  {
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
        exitTime: '15:25',
        maxTradesPerDay: 3,
        status: 'active'
      },
      tradeAction: { action: 'Long', orderType: 'SL-Market', bufferPercent: 0.1 },
      stoploss: { type: 'Trailing SL', orderType: 'Market', fixedPercent: 1, fixedPoints: 10, trailingSL: 0.5, riskPercent: 1.0 },
      target: { type: 'Trailing Target', profitPercent: 2, riskRewardRatio: 2.0, partialExit: 100, trailingTarget: 0.5 },
      riskManagement: { capitalAllocation: 10.0, riskPerTrade: 3, misMarginRate: 0.20, maxDailyLoss: -1, maxDailyProfit: -1, maxOpenPositions: 3, killSwitch: false },
      conditions: []
    }),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export let inMemoryClients: any[] = [
  {
    id: 'c1',
    user: { name: 'Aman Sharma', email: 'aman.sharma@example.com', userId: 'aman_sharma', status: 'active' },
    zerodhaClientId: 'IN30123456789012',
    accessToken: 'tok_active_aman_123',
    capital: 25000000.00,
    riskPercentage: 1.00,
    tradingStatus: 'active',
    subscriptionStatus: 'active',
    strategyId: 'pre-open-breakout',
    zerodhaTotpSecret: 'ZTOTPAMAN123',
  },
  {
    id: 'c2',
    user: { name: 'Rahul Kumar', email: 'rahul.kumar@example.com', userId: 'rahul_kumar', status: 'active' },
    zerodhaClientId: 'IN30223456789012',
    accessToken: null,
    capital: 12750000.00,
    riskPercentage: 1.00,
    tradingStatus: 'inactive',
    subscriptionStatus: 'active',
    strategyId: 'pre-open-breakout',
    zerodhaTotpSecret: 'ZTOTPRAHUL456',
  },
  {
    id: 'c3',
    user: { name: 'Neha Patel', email: 'neha.patel@example.com', userId: 'neha_patel', status: 'active' },
    zerodhaClientId: 'IN30323456789012',
    accessToken: 'tok_expired_neha',
    capital: 500000.00,
    riskPercentage: 1.00,
    tradingStatus: 'inactive',
    subscriptionStatus: 'expired',
    strategyId: 'pre-open-breakout',
    zerodhaTotpSecret: 'ZTOTPNEHA789',
  }
];

export let inMemoryTrades: any[] = [];
