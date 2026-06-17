import { NextResponse } from 'next/server';
import { algoEngine } from '../../../models/algoEngine';

export async function GET() {
  try {
    console.log("Live Server: Triggering manual execution check of Pre-Open strategy...");
    
    // Trigger the real production strategy evaluation and execution algorithm
    await algoEngine.executePreOpenTrades('system-admin-mock');
    
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
