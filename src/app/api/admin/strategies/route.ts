import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';


import { getCachedData, invalidateCache } from '../../../../shared/utils/redis';

export async function GET() {
  try {
    const dbStrategies = await getCachedData('all_strategies', async () => {
      return await prisma.strategy.findMany({
        include: {
          conditions: true,
          assignments: true,
          logs: true
        },
        orderBy: { createdAt: 'desc' }
      });
    }, 15);
    // Always return DB result (even if empty) — only fallback on real errors
    return NextResponse.json({ success: true, strategies: dbStrategies });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Database query failed' }, { status: 500 });
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
      // Backward compat: convert old tradeAction + entryTime + timeframe → legs[]
      if (config.tradeAction && !config.legs) {
        config.legs = [{
          name: 'Leg 1',
          enabled: true,
          entryTime: config.basicInfo?.entryTime || '09:20:30',
          timeframe: config.basicInfo?.timeframe || '5m',
          tradeAction: { ...config.tradeAction }
        }];
        delete config.tradeAction;
        delete config.basicInfo?.entryTime;
        delete config.basicInfo?.timeframe;
      }
      if (config.riskManagement) {
        if (config.riskManagement.maxDailyLoss !== undefined && config.riskManagement.maxDailyLoss < -1) config.riskManagement.maxDailyLoss = -1;
        if (config.riskManagement.maxDailyProfit !== undefined && config.riskManagement.maxDailyProfit < -1) config.riskManagement.maxDailyProfit = -1;
        if (config.riskManagement.misMarginRate !== undefined && config.riskManagement.misMarginRate < -1) config.riskManagement.misMarginRate = -1;
        if (config.riskManagement.capitalAllocation !== undefined && config.riskManagement.capitalAllocation < -1) config.riskManagement.capitalAllocation = -1;
      }
      if (config.stoploss && config.stoploss.trailingSL !== undefined && config.stoploss.trailingSL < -1) config.stoploss.trailingSL = -1;
      if (config.target && config.target.trailingTarget !== undefined && config.target.trailingTarget < -1) config.target.trailingTarget = -1;
      // Sanitize per-leg marketProtection
      if (config.legs && Array.isArray(config.legs)) {
        for (const leg of config.legs) {
          if (leg.tradeAction && leg.tradeAction.marketProtection !== undefined && leg.tradeAction.marketProtection < -1) {
            leg.tradeAction.marketProtection = -1;
          }
        }
      }
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

      await invalidateCache('all_strategies');
      return NextResponse.json({ success: true, strategy: newStrategy });
    } catch (dbErr: any) {
      return NextResponse.json({ success: false, error: 'Failed to create strategy' }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}


