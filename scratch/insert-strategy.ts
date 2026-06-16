import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import dotenv from 'dotenv';
import ws from 'ws';

dotenv.config();

// Enable WebSockets in node environment for Neon Serverless Driver
global.WebSocket = ws as any;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });


const strategyConfig = {
  basicInfo: {
    name: 'Pre Open Momentum Breakout',
    description: 'Scans Nifty 200 for maximum gap-downs at 09:08 AM, buys high of 5-min candle with 1% risk.',
    tradeType: 'Intraday',
    exchange: 'NSE',
    segment: 'NSE F&O',
    timeframe: '5m',
    entryTime: '09:15',
    exitTime: '15:25',
    maxTradesPerDay: 3,
    status: 'active'
  },
  tradeAction: {
    action: 'Long',
    orderType: 'SL-Market',
    bufferPercent: 0.1
  },
  stoploss: {
    type: 'Fixed %',
    orderType: 'Market',
    fixedPercent: 0.5,
    fixedPoints: 10,
    trailingSL: 0.2,
    riskPercent: 1.0
  },
  target: {
    type: 'Profit %',
    profitPercent: 1.5,
    riskRewardRatio: 3.0,
    partialExit: 100,
    trailingTarget: 0.5
  },
  riskManagement: {
    capitalAllocation: 10.0,
    riskPerTrade: 1.0,
    maxDailyLoss: 5000,
    maxDailyProfit: 15000,
    maxOpenPositions: 3,
    killSwitch: false
  },
  conditions: [
    {
      logical: 'AND',
      indicator: 'Pre Open Change %',
      operator: '<',
      value: '0' // Top Loser
    },
    {
      logical: 'AND',
      indicator: 'Price Action',
      operator: '>',
      value: 'Previous 5m High' // 5 Min Candle Breakout
    }
  ]
};

async function main() {
  const strategy = await prisma.strategy.create({
    data: {
      name: strategyConfig.basicInfo.name,
      description: strategyConfig.basicInfo.description,
      status: strategyConfig.basicInfo.status,
      configJson: JSON.stringify(strategyConfig)
    }
  });

  for (const cond of strategyConfig.conditions) {
    await prisma.strategyCondition.create({
      data: {
        strategyId: strategy.id,
        logical: cond.logical,
        indicator: cond.indicator,
        operator: cond.operator,
        value: cond.value
      }
    });
  }

  console.log(`Successfully created strategy: ${strategy.name} (ID: ${strategy.id})`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
