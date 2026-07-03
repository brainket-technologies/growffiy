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
