export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '../../../../../database/db';
import { inMemoryStrategies } from '../route';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, configJson, status } = body;

    try {
      // Clean previous conditions first
      if (configJson) {
        try {
          await prisma.strategyCondition.deleteMany({
            where: { strategyId: id }
          });
        } catch (e) {}
      }

      const updatedStrategy = await prisma.strategy.update({
        where: { id },
        data: {
          name,
          description,
          status,
          configJson
        }
      });

      if (configJson) {
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
        // Sanitize risk values (prevent < -1)
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
        body.configJson = JSON.stringify(config);
        if (config.conditions && Array.isArray(config.conditions)) {
          for (const cond of config.conditions) {
            await prisma.strategyCondition.create({
              data: {
                strategyId: id,
                logical: cond.logical || 'AND',
                indicator: cond.indicator,
                operator: cond.operator,
                value: cond.value
              }
            });
          }
        }
      }

      // Log action
      try {
        const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
        if (admin) {
          await prisma.auditLog.create({
            data: {
              adminId: admin.id,
              action: 'UPDATE_STRATEGY',
              newValue: `Updated strategy ${name || id}`
            }
          });
          await prisma.strategyLog.create({
            data: {
              strategyId: id,
              message: `Strategy configuration updated.`,
              logType: 'info'
            }
          });
        }
      } catch (auditErr) {}

      return NextResponse.json({ success: true, strategy: updatedStrategy });
    } catch (dbErr) {
      console.error('DB Update failed, updating in-memory:', dbErr);
      const index = inMemoryStrategies.findIndex(s => s.id === id);
      if (index !== -1) {
        inMemoryStrategies[index] = {
          ...inMemoryStrategies[index],
          name: name ?? inMemoryStrategies[index].name,
          description: description ?? inMemoryStrategies[index].description,
          status: status ?? inMemoryStrategies[index].status,
          configJson: configJson ?? inMemoryStrategies[index].configJson,
          updatedAt: new Date().toISOString()
        };
        return NextResponse.json({ success: true, strategy: inMemoryStrategies[index], isDemoMode: true });
      }
      return NextResponse.json({ success: false, error: 'Strategy not found' }, { status: 404 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Use a transaction to atomically delete all children then the strategy
    await prisma.$transaction(async (tx) => {
      // 1. Unlink clients that reference this strategy
      await tx.client.updateMany({
        where: { strategyId: id },
        data: { strategyId: null }
      });

      // 2. Delete trades
      await tx.trade.deleteMany({ where: { strategyId: id } });

      // 3. Delete child strategy records
      await tx.strategyCondition.deleteMany({ where: { strategyId: id } });
      await tx.strategyAssignment.deleteMany({ where: { strategyId: id } });
      await tx.strategyLog.deleteMany({ where: { strategyId: id } });
      await tx.strategyBacktest.deleteMany({ where: { strategyId: id } });

      // 4. Delete the strategy itself
      await tx.strategy.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (dbErr: any) {
    console.error('DB Delete failed:', dbErr);

    // Fallback: try to delete from in-memory store
    const index = inMemoryStrategies.findIndex(s => s.id === id);
    if (index !== -1) {
      inMemoryStrategies.splice(index, 1);
      return NextResponse.json({ success: true, isDemoMode: true });
    }

    return NextResponse.json(
      { success: false, error: dbErr.message || 'Delete failed' },
      { status: 500 }
    );
  }
}


// Clone action via POST
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (action !== 'clone') {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    let sourceStrategy: any;
    try {
      sourceStrategy = await prisma.strategy.findUnique({
        where: { id },
        include: { conditions: true }
      });
    } catch (e) {
      sourceStrategy = inMemoryStrategies.find(s => s.id === id);
    }

    if (!sourceStrategy) {
      return NextResponse.json({ success: false, error: 'Source strategy not found' }, { status: 404 });
    }

    const newName = `${sourceStrategy.name} (Clone)`;
    const newConfigJson = sourceStrategy.configJson;

    try {
      const clonedStrategy = await prisma.strategy.create({
        data: {
          name: newName,
          description: sourceStrategy.description,
          status: 'inactive', // Default to inactive when cloned
          configJson: newConfigJson
        }
      });

      // Clone conditions
      if (sourceStrategy.conditions && Array.isArray(sourceStrategy.conditions)) {
        for (const cond of sourceStrategy.conditions) {
          await prisma.strategyCondition.create({
            data: {
              strategyId: clonedStrategy.id,
              logical: cond.logical,
              indicator: cond.indicator,
              operator: cond.operator,
              value: cond.value
            }
          });
        }
      }

      // Log clone
      try {
        const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
        if (admin) {
          await prisma.auditLog.create({
            data: {
              adminId: admin.id,
              action: 'CLONE_STRATEGY',
              newValue: `Cloned strategy ${sourceStrategy.name} to ${newName}`
            }
          });
          await prisma.strategyLog.create({
            data: {
              strategyId: clonedStrategy.id,
              message: `Strategy cloned from ${sourceStrategy.name}.`,
              logType: 'info'
            }
          });
        }
      } catch (auditErr) {}

      return NextResponse.json({ success: true, strategy: clonedStrategy });
    } catch (dbErr) {
      console.error('DB Clone failed, cloning in-memory:', dbErr);
      const newMock = {
        id: `strat_clone_${Date.now()}`,
        name: newName,
        description: sourceStrategy.description,
        status: 'inactive',
        configJson: newConfigJson,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      inMemoryStrategies.unshift(newMock);
      return NextResponse.json({ success: true, strategy: newMock, isDemoMode: true });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
