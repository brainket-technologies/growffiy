import { NextResponse } from 'next/server';
import { prisma } from '../../../../database/db';

// Mock DB in memory fallback (only used when DB is unreachable)
let inMemoryStrategies: any[] = [
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

export async function GET() {
  try {
    const dbStrategies = await prisma.strategy.findMany({
      include: {
        conditions: true,
        assignments: true,
        logs: true
      },
      orderBy: { createdAt: 'desc' }
    });
    // Always return DB result (even if empty) — only fallback on real errors
    return NextResponse.json({ success: true, strategies: dbStrategies });
  } catch (error) {
    // Only return mock data when DB is completely unreachable
    return NextResponse.json({ success: true, strategies: inMemoryStrategies, isDemoMode: true });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, configJson, status } = body;

    try {
      const newStrategy = await prisma.strategy.create({
        data: {
          name,
          description,
          status: status || 'active',
          configJson
        }
      });

      // Parse and sanitize risk values (prevent < -1)
      const config = JSON.parse(configJson);
      if (config.riskManagement) {
        if (config.riskManagement.maxDailyLoss !== undefined && config.riskManagement.maxDailyLoss < -1) config.riskManagement.maxDailyLoss = -1;
        if (config.riskManagement.maxDailyProfit !== undefined && config.riskManagement.maxDailyProfit < -1) config.riskManagement.maxDailyProfit = -1;
        if (config.riskManagement.misMarginRate !== undefined && config.riskManagement.misMarginRate < -1) config.riskManagement.misMarginRate = -1;
        if (config.riskManagement.capitalAllocation !== undefined && config.riskManagement.capitalAllocation < -1) config.riskManagement.capitalAllocation = -1;
      }
      if (config.stoploss && config.stoploss.trailingSL !== undefined && config.stoploss.trailingSL < -1) config.stoploss.trailingSL = -1;
      if (config.target && config.target.trailingTarget !== undefined && config.target.trailingTarget < -1) config.target.trailingTarget = -1;
      if (config.tradeAction && config.tradeAction.marketProtection !== undefined && config.tradeAction.marketProtection < -1) config.tradeAction.marketProtection = -1;
      // Update configJson with sanitized values
      body.configJson = JSON.stringify(config);
      if (config.conditions && Array.isArray(config.conditions)) {
        for (const cond of config.conditions) {
          await prisma.strategyCondition.create({
            data: {
              strategyId: newStrategy.id,
              logical: cond.logical || 'AND',
              indicator: cond.indicator,
              operator: cond.operator,
              value: cond.value
            }
          });
        }
      }

      // Log action
      try {
        const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
        if (admin) {
          await prisma.auditLog.create({
            data: {
              adminId: admin.id,
              action: 'CREATE_STRATEGY',
              newValue: `Created strategy ${name}`
            }
          });
          await prisma.strategyLog.create({
            data: {
              strategyId: newStrategy.id,
              message: `Strategy ${name} created successfully.`,
              logType: 'info'
            }
          });
        }
      } catch (auditErr) {}

      return NextResponse.json({ success: true, strategy: newStrategy });
    } catch (dbErr: any) {
      console.error('DB Strategy creation failed, using in-memory:', dbErr);
      const newMockStrategy = {
        id: `strat_${Date.now()}`,
        name,
        description,
        status: status || 'active',
        configJson,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      inMemoryStrategies.unshift(newMockStrategy);
      return NextResponse.json({ success: true, strategy: newMockStrategy, isDemoMode: true });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export { inMemoryStrategies };
