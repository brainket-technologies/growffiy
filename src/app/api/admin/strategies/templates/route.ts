import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';

const DEFAULT_TEMPLATES = [
  {
    id: 'tmpl-intraday-momentum',
    name: 'Intraday Momentum Trend Follower',
    description: 'RSI-based momentum filter combined with double EMA cross-over for strong trend capturing.',
    configJson: JSON.stringify({
      basicInfo: {
        name: 'Intraday Momentum Trend Follower',
        description: 'RSI-based momentum filter combined with double EMA cross-over for strong trend capturing.',
        tradeType: 'Intraday',
        exchange: 'NSE',
        segment: 'NSE F&O',
        timeframe: '5m',
        entryTime: '09:30',
        exitTime: '15:15',
        maxTradesPerDay: 4,
        preSelectTime: '09:15',
        status: 'active'
      },
      tradeAction: {
        action: 'Long',
        orderType: 'Market',
        bufferPercent: 0.0
      },
      stoploss: {
        type: 'Trailing SL',
        orderType: 'Market',
        fixedPercent: 1,
        fixedPoints: 10,
        trailingSL: 0.3,
        riskPercent: 1.0
      },
      target: {
        type: 'Trailing Target',
        profitPercent: 2,
        riskRewardRatio: 2.5,
        partialExit: 50,
        trailingTarget: 0.5
      },
      riskManagement: {
        capitalAllocation: 10.0,
        riskPerTrade: 3,
        misMarginRate: 0.20,
        maxDailyLoss: -1,
        maxDailyProfit: -1,
        maxOpenPositions: 3,
        killSwitch: false
      },
      conditions: []
    })
  },
  {
    id: 'tmpl-opening-range-breakout',
    name: 'Opening Range Breakout (ORB)',
    description: 'Triggers trades when price breaks above or below the opening 15-minute high or low.',
    configJson: JSON.stringify({
      basicInfo: {
        name: 'Opening Range Breakout (ORB)',
        description: 'Triggers trades when price breaks above or below the opening 15-minute high or low.',
        tradeType: 'Intraday',
        exchange: 'NSE',
        segment: 'Cash',
        timeframe: '15m',
        entryTime: '09:30',
        exitTime: '15:00',
        maxTradesPerDay: 1,
        preSelectTime: '09:15',
        status: 'active'
      },
      tradeAction: {
        action: 'Long',
        orderType: 'Limit',
        bufferPercent: 0.05
      },
      stoploss: {
        type: 'Fixed Points',
        orderType: 'Market',
        fixedPercent: 1,
        fixedPoints: 15,
        trailingSL: 0.0,
        riskPercent: 1.0
      },
      target: {
        type: 'Profit %',
        profitPercent: 2,
        riskRewardRatio: 3.0,
        partialExit: 100,
        trailingTarget: 0.0
      },
      riskManagement: {
        capitalAllocation: 20.0,
        riskPerTrade: 3,
        misMarginRate: 0.20,
        maxDailyLoss: -1,
        maxDailyProfit: -1,
        maxOpenPositions: 1,
        killSwitch: false
      },
      conditions: []
    })
  },
  {
    id: 'tmpl-first-minute-strategy',
    name: 'First Minute Strategy',
    description: 'Finds the top 10 gainers/losers in preopen and takes a trade based on the first 1-minute candle breakout.',
    configJson: JSON.stringify({
      basicInfo: {
        name: 'First Minute Strategy',
        description: 'Finds the top 10 gainers/losers in preopen and takes a trade based on the first 1-minute candle breakout.',
        tradeType: 'Intraday',
        exchange: 'NSE',
        segment: 'NSE F&O',
        entryTime: '09:20:00',
        exitTime: '15:15:00',
        maxTradesPerDay: 10,
        preSelectTime: '09:08:00',
        selectPosition: 1,
        topCount: 10,
        status: 'active',
        engineType: 'FIRST_MINUTE'
      },
      legs: [
        {
          name: 'Leg 1',
          enabled: true,
          timeframe: '1m',
          tradeAction: {
            action: 'Long',
            orderType: 'SL-Market',
            bufferPercent: 0.2,
            marketProtection: 0.05
          }
        }
      ],
      stoploss: {
        type: 'Fixed %',
        orderType: 'Market',
        fixedPercent: 1.0,
        fixedPoints: 10,
        riskPercent: 1.0
      },
      target: {
        type: 'Profit %',
        profitPercent: 3.0,
        riskRewardRatio: 3.0
      },
      riskManagement: {
        capitalAllocation: 100,
        riskPerTrade: 1,
        maxDailyLoss: -1,
        maxDailyProfit: -1,
        maxOpenPositions: 10,
        killSwitch: false
      },
      conditions: []
    })
  },
  {
    id: 'tmpl-nifty-market-strategy',
    name: 'Nifty 500 Top Gainer 15M (Nifty Market)',
    description: 'Top Gainer breakout from Nifty 500 at 09:30:30 AM with 15-minute candle, buffer 0.2%, SL 1%, Target 2%, Trailing SL 1.5%.',
    configJson: JSON.stringify({
      basicInfo: {
        name: 'Nifty 500 Top Gainer 15M',
        description: 'Top Gainer breakout from Nifty 500 at 09:30:30 AM with 15-minute candle, buffer 0.2%, SL 1%, Target 2%, Trailing SL 1.5%.',
        tradeType: 'Intraday',
        exchange: 'NSE',
        segment: 'NIFTY 500',
        indexName: 'NIFTY 500',
        snapshotTimeSlot: '09:30',
        entryTime: '09:30:30',
        preSelectTime: '09:29:00',
        exitTime: '15:15:00',
        maxTradesPerDay: 1,
        selectPosition: 1,
        numberOfStocks: 1,
        topCount: 20,
        ohlcCondition: 'None',
        stockSelectionType: 'gainers',
        status: 'active',
        engineType: 'NIFTY_MARKET'
      },
      legs: [
        {
          name: 'Leg 1 (Long Gainer)',
          enabled: true,
          timeframe: '15m',
          tradeAction: {
            action: 'Long',
            orderType: 'SL-Market',
            candlePriceType: 'high',
            candlePattern: 'None',
            entryBufferPercent: 0.2,
            slBufferPercent: 0,
            marketProtection: -1,
            selectPosition: 1
          }
        }
      ],
      stoploss: {
        type: 'Fixed %',
        orderType: 'Market',
        fixedPercent: 1.0,
        fixedPoints: 10,
        trailingSL: 1.5,
        riskPercent: 1.0
      },
      target: {
        type: 'Profit %',
        profitPercent: 2.0,
        riskRewardRatio: 2.0,
        partialExit: 100,
        trailingTarget: -1
      },
      riskManagement: {
        capitalAllocation: -1,
        riskPerTrade: 2,
        misMarginRate: -1,
        maxDailyLoss: -1,
        maxDailyProfit: -1,
        maxOpenPositions: 2,
        killSwitch: false
      },
      conditions: [
        {
          value: '-10',
          logical: 'AND',
          operator: '>',
          indicator: 'Pre Open Change %'
        }
      ]
    })
  },
  {
    id: 'tmpl-nifty-market-loser-strategy',
    name: 'Nifty 500 Top Loser 15M (Nifty Market)',
    description: 'Top Loser breakdown from Nifty 500 at 09:30:30 AM with 15-minute candle, buffer 0.2%, SL 1%, Target 2%, Trailing SL 1.5%.',
    configJson: JSON.stringify({
      basicInfo: {
        name: 'Nifty 500 Top Loser 15M',
        description: 'Top Loser breakdown from Nifty 500 at 09:30:30 AM with 15-minute candle, buffer 0.2%, SL 1%, Target 2%, Trailing SL 1.5%.',
        tradeType: 'Intraday',
        exchange: 'NSE',
        segment: 'NIFTY 500',
        indexName: 'NIFTY 500',
        snapshotTimeSlot: '09:30',
        entryTime: '09:30:30',
        preSelectTime: '09:29:00',
        exitTime: '15:15:00',
        maxTradesPerDay: 1,
        selectPosition: 1,
        numberOfStocks: 1,
        topCount: 20,
        ohlcCondition: 'None',
        stockSelectionType: 'losers',
        status: 'active',
        engineType: 'NIFTY_MARKET'
      },
      legs: [
        {
          name: 'Leg 1 (Short Loser)',
          enabled: true,
          timeframe: '15m',
          tradeAction: {
            action: 'Short',
            orderType: 'SL-Market',
            candlePriceType: 'low',
            candlePattern: 'None',
            entryBufferPercent: 0.2,
            slBufferPercent: 0,
            marketProtection: -1,
            selectPosition: 1
          }
        }
      ],
      stoploss: {
        type: 'Fixed %',
        orderType: 'Market',
        fixedPercent: 1.0,
        fixedPoints: 10,
        trailingSL: 1.5,
        riskPercent: 1.0
      },
      target: {
        type: 'Profit %',
        profitPercent: 2.0,
        riskRewardRatio: 2.0,
        partialExit: 100,
        trailingTarget: -1
      },
      riskManagement: {
        capitalAllocation: -1,
        riskPerTrade: 2,
        misMarginRate: -1,
        maxDailyLoss: -1,
        maxDailyProfit: -1,
        maxOpenPositions: 2,
        killSwitch: false
      },
      conditions: [
        {
          value: '10',
          logical: 'AND',
          operator: '<',
          indicator: 'Pre Open Change %'
        }
      ]
    })
  }
];

export async function GET() {
  try {
    const dbTemplates = await prisma.strategyTemplate.findMany();
    const existingNames = new Set(dbTemplates.map((t: any) => (t.name || '').toLowerCase()));
    const merged = [...dbTemplates];
    for (const dt of DEFAULT_TEMPLATES) {
      if (!existingNames.has(dt.name.toLowerCase())) {
        merged.push(dt as any);
      }
    }
    return NextResponse.json({ success: true, templates: merged });
  } catch (error) {
    return NextResponse.json({ success: true, templates: DEFAULT_TEMPLATES, isDemoMode: true });
  }
}
