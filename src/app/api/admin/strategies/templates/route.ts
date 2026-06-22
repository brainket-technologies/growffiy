import { NextResponse } from 'next/server';
import { prisma } from '../../../../../database/db';

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
  }
];

export async function GET() {
  try {
    const dbTemplates = await prisma.strategyTemplate.findMany();
    if (dbTemplates.length === 0) {
      return NextResponse.json({ success: true, templates: DEFAULT_TEMPLATES });
    }
    return NextResponse.json({ success: true, templates: dbTemplates });
  } catch (error) {
    return NextResponse.json({ success: true, templates: DEFAULT_TEMPLATES, isDemoMode: true });
  }
}
