import { NextResponse } from 'next/server';
import { algoEngine } from '../../../models/algoEngine';

export async function GET() {
  try {
    console.log("Live Server: Triggering manual execution check of Pre-Open strategy...");
    
    const mockStocks = [
      {
        symbol: 'TATASTEEL',
        name: 'Tata Steel Limited',
        ltp: 180.0,
        open: 180.0,
        high: 181.0,
        low: 179.0,
        prevClose: 184.56,
        volume: 50000,
        change: -4.56,
        changePercent: -2.48,
        iep: 180.0,
        final: 180.0,
        finalQuantity: 50000,
        value: 9.0,
        ffmCap: 9000,
        nm52wH: 200.0,
        nm52wL: 140.0,
        isFo: true,
        isNifty50: true
      }
    ];

    // Trigger the real production strategy evaluation and execution algorithm with mock stock
    await algoEngine.executePreOpenTrades('system-admin-mock', mockStocks);
    
    return NextResponse.json({
      success: true,
      message: "Strategy execution triggered successfully. Go to Live Trading page to see the trade if any F&O stock matched the conditions!"
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || String(error)
    }, { status: 500 });
  }
}
