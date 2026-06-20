import { NextResponse } from 'next/server';
import { algoEngine } from '../../../shared/models/algoEngine';

import { prisma } from '../../../database/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log("Live Server: Triggering dynamic manual execution check of Pre-Open strategy...");

    // Find first active client with a strategy
    const activeClient = await prisma.client.findFirst({
      where: {
        tradingStatus: 'active',
        subscriptionStatus: 'active',
        strategyId: { not: null }
      },
      include: { strategy: true }
    });

    if (!activeClient || !activeClient.strategy) {
      throw new Error("No active clients with assigned strategies found in database.");
    }

    const config = activeClient.strategy.configJson ? JSON.parse(activeClient.strategy.configJson) : null;
    if (!config) {
      throw new Error(`Strategy "${activeClient.strategy.name}" is missing configJson configuration.`);
    }

    const segment = config.basicInfo?.segment || 'NSE F&O';
    let isFo = false;
    let isNifty50 = false;
    let isBankNifty = false;

    if (segment === 'NSE F&O' || segment === 'Futures' || segment === 'Options') {
      isFo = true;
    } else if (segment === 'Nifty 50' || segment === 'Nifty') {
      isNifty50 = true;
    } else if (segment === 'Bank Nifty' || segment === 'BankNifty') {
      isBankNifty = true;
    }

    // Default stock quote values
    let prevClose = 200.0;
    let changePercent = -1.5; // default negative change matching the typical Pre-Open Momentum gap-down

    // Parse conditions dynamically to satisfy the filter
    if (config.conditions && Array.isArray(config.conditions)) {
      for (const cond of config.conditions) {
        if (cond.indicator === 'Pre Open Change %') {
          const val = Number(cond.value);
          if (cond.operator === '<' || cond.operator === '<=') {
            changePercent = val - 1.0;
          } else if (cond.operator === '>' || cond.operator === '>=') {
            changePercent = val + 1.0;
          } else if (cond.operator === '==' || cond.operator === '===') {
            changePercent = val;
          }
        }
      }
    }

    const change = Number((prevClose * (changePercent / 100)).toFixed(2));
    const entryVal = Number((prevClose + change).toFixed(2));

    const mockStocks = [
      {
        symbol: 'TATASTEEL',
        name: 'Tata Steel Limited',
        ltp: entryVal,
        open: entryVal,
        high: entryVal + 1.0,
        low: entryVal - 1.0,
        prevClose: prevClose,
        volume: 50000,
        change: change,
        changePercent: changePercent,
        iep: entryVal,
        final: entryVal,
        finalQuantity: 50000,
        value: 9.0,
        ffmCap: 9000,
        nm52wH: 220.0,
        nm52wL: 140.0,
        isFo,
        isNifty50,
        isBankNifty
      }
    ];

    // Trigger the real production strategy evaluation and execution algorithm with mock stock
    await algoEngine.executePreOpenTrades('system-admin-mock', mockStocks);
    
    return NextResponse.json({
      success: true,
      message: `Strategy "${activeClient.strategy.name}" execution triggered dynamically using mock stock ${mockStocks[0].symbol} (${mockStocks[0].changePercent}% change) matching segment "${segment}".`
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || String(error)
    }, { status: 500 });
  }
}
