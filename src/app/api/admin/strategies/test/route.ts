import { NextResponse } from 'next/server';

interface MockData {
  symbol: string;
  ltp: number;
  candlePrice: number;
  availableCapital: number;
  openPositions: number;
  dbCapital: number;
}

export async function POST(request: Request) {
  try {
    const { configJson, mockData } = await request.json();
    const config = typeof configJson === 'string' ? JSON.parse(configJson) : configJson;
    const mock: MockData = {
      symbol: mockData?.symbol || 'TATASTEEL',
      ltp: Number(mockData?.ltp) || 0,
      candlePrice: Number(mockData?.candlePrice) || 0,
      availableCapital: Number(mockData?.availableCapital) || 50000,
      openPositions: Number(mockData?.openPositions) || 0,
      dbCapital: Number(mockData?.dbCapital) || Number(mockData?.availableCapital) || 50000,
    };

    const legs = config.legs && config.legs.length > 0 ? config.legs : [];
    const leg0 = legs[0] || {};
    const ta = leg0.tradeAction || config.tradeAction || {};

    const candleType = ta.candlePriceType || 'high';
    const candlePrice = mock.candlePrice;

    const isLong = ta.action === 'Long' || ta.action === 'Buy';

    const bufferPct = ta.bufferPercent;
    const breakoutEntryPrice = (bufferPct === undefined || bufferPct === null || bufferPct === -1)
      ? candlePrice
      : isLong
        ? candlePrice * (1 + bufferPct / 100)
        : candlePrice * (1 - bufferPct / 100);

    const currentLtp = mock.ltp;
    const hasPriceAction = config.conditions?.some((c: any) => c.indicator === 'Price Action');
    const isSLMarket = ta.orderType === 'SL-Market';
    const breakoutPassed = isSLMarket || !hasPriceAction || (isLong ? currentLtp >= breakoutEntryPrice : currentLtp <= breakoutEntryPrice);

    const entryPrice = breakoutEntryPrice;

    const slType = config.stoploss?.type;
    const slPercent = config.stoploss?.fixedPercent || 1;
    const riskPercent = config.riskManagement?.riskPerTrade || 3;

    let slPoints: number;
    if (slType === 'Fixed Points') {
      slPoints = config.stoploss?.fixedPoints || 10;
    } else if (slType === 'Risk %') {
      slPoints = entryPrice * (config.stoploss?.riskPercent || 1) / 100;
    } else {
      slPoints = entryPrice * (slPercent / 100);
    }
    if (slPoints <= 0) slPoints = 1;

    let capitalAtRisk = mock.availableCapital * (riskPercent / 100);
    const dbCapitalLimit = mock.dbCapital;
    if (capitalAtRisk > dbCapitalLimit) {
      capitalAtRisk = dbCapitalLimit;
    }

    let quantity = 0;
    if (slPoints > 0) {
      quantity = Math.floor(capitalAtRisk / slPoints);
    }

    const misMarginRate = config.riskManagement?.misMarginRate;
    if (misMarginRate && misMarginRate > 0 && entryPrice > 0) {
      const qtyByBuyingPower = Math.floor(mock.availableCapital / (entryPrice * misMarginRate));
      quantity = Math.min(quantity, qtyByBuyingPower);
    }

    const stopLoss = isLong ? entryPrice - slPoints : entryPrice + slPoints;
    let target: number;
    const targetType = config.target?.type;
    const targetPercent = config.target?.profitPercent || 2;
    if (targetType === 'Risk Reward Ratio') {
      const rr = config.target?.riskRewardRatio || 2;
      target = isLong ? entryPrice + (slPoints * rr) : entryPrice - (slPoints * rr);
    } else {
      target = isLong ? entryPrice * (1 + targetPercent / 100) : entryPrice * (1 - targetPercent / 100);
    }

    const maxOpen = config.riskManagement?.maxOpenPositions || 3;
    const wouldTrade = breakoutPassed && quantity > 0 && mock.openPositions < maxOpen;

    const dirLabel = isLong ? 'LONG' : 'SHORT';

    const reasons: string[] = [];
    if (isSLMarket) reasons.push(`[${dirLabel}] SL-Market order — breakout check auto-pass`);
    else if (!hasPriceAction) reasons.push(`[${dirLabel}] No Price Action condition — breakout check auto-pass`);
    else if (breakoutPassed) reasons.push(`[${dirLabel}] Breakout PASS: LTP (${currentLtp}) ${isLong ? '≥' : '≤'} Entry (${Number(breakoutEntryPrice.toFixed(2))})`);
    else reasons.push(`[${dirLabel}] Breakout FAIL: LTP (${currentLtp}) ${isLong ? '<' : '>'} Entry (${Number(breakoutEntryPrice.toFixed(2))})`);
    if (quantity > 0) reasons.push(`[${dirLabel}] Quantity computed: ${quantity} (₹${capitalAtRisk.toFixed(0)} / ₹${slPoints.toFixed(2)})`);
    else reasons.push(`[${dirLabel}] Quantity is 0 (capital at risk too low)`);
    if (mock.openPositions < maxOpen) reasons.push(`[${dirLabel}] Open positions (${mock.openPositions}) < max (${maxOpen})`);
    else reasons.push(`[${dirLabel}] Max open positions reached (${mock.openPositions}/${maxOpen})`);
    if (misMarginRate && misMarginRate > 0) {
      const bpQty = Math.floor(mock.availableCapital / (entryPrice * misMarginRate));
      reasons.push(`[${dirLabel}] Buying power check (misMarginRate=${misMarginRate}): max ${bpQty} qty`);
    }

    return NextResponse.json({
      success: true,
      results: {
        candleType,
        candlePrice: Number(candlePrice.toFixed(2)),
        breakoutEntryPrice: Number(breakoutEntryPrice.toFixed(2)),
        currentLtp,
        breakoutPassed,
        isSLMarket,
        hasPriceAction,
        entryPrice: Number(entryPrice.toFixed(2)),
        slPoints: Number(slPoints.toFixed(2)),
        capitalAtRisk: Number(capitalAtRisk.toFixed(2)),
        quantity,
        stopLoss: Number(stopLoss.toFixed(2)),
        target: Number(target.toFixed(2)),
        productType: 'MIS',
        orderType: ta.orderType || 'Market',
        wouldTrade,
        reasons,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

import { algoEngine } from '@/shared/models/algoEngine';
import { prisma } from '@/database/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const engineType = searchParams.get('engintype');

    const engine = algoEngine;
    
    // Fetch all active strategies from DB
    const strategies = await prisma.strategy.findMany({
      where: { status: 'active' }
    });

    if (!strategies.length) {
      return NextResponse.json({ success: false, message: 'No active strategies found.' });
    }

    // Capture logs from console to return to user
    const originalConsoleLog = console.log;
    const logs: string[] = [];
    console.log = (...args: any[]) => {
      logs.push(args.join(' '));
      originalConsoleLog(...args);
    };

    let strategiesToRun = strategies;
    if (engineType) {
        strategiesToRun = strategies.filter(s => {
            let configObj: any = {};
            try { configObj = typeof s.configJson === 'string' ? JSON.parse(s.configJson) : (s.configJson || {}); } catch(e){}
            const sEngineType = configObj?.basicInfo?.engineType;
            if (sEngineType) {
                return sEngineType === engineType;
            }
            // fallback for legacy strategies
            const dbName = s.name.toLowerCase();
            const configName = configObj?.basicInfo?.name?.toLowerCase() || '';
            if (engineType === 'TEN_AM' && (dbName.includes('ten am') || configName.includes('ten am'))) return true;
            if (engineType === 'FIRST_MINUTE' && (dbName.includes('first minute') || configName.includes('first minute'))) return true;
            return false;
        });
    }

    if (!strategiesToRun.length && engineType) {
        console.log = originalConsoleLog;
        return NextResponse.json({ success: false, message: `No active strategies found for engine type: ${engineType}` });
    }

    // Pre-select clients for only the filtered strategies
    for (const st of strategiesToRun) {
        await engine.preSelectAllClients(st.id);
    }

    // Run the execution manually for filtered strategies
    for (const st of strategiesToRun) {
        let configObj: any = {};
        try { configObj = typeof st.configJson === 'string' ? JSON.parse(st.configJson) : (st.configJson || {}); } catch(e){}
        const activeLegs = (configObj?.legs || []).filter((l: any) => l.enabled);
        
        if (activeLegs.length > 0) {
            for (let li = 0; li < activeLegs.length; li++) {
                await engine.executePreOpenTrades('test-admin-dry-run', undefined, st.id, li);
            }
        } else {
            await engine.executePreOpenTrades('test-admin-dry-run', undefined, st.id);
        }
    }

    // Restore console.log
    console.log = originalConsoleLog;

    return NextResponse.json({
      success: true,
      message: `Dry run completed successfully for ${strategiesToRun.length} strategy(ies)!`,
      strategyIds: strategiesToRun.map(s => s.id),
      logs
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
