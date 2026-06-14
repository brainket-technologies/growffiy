import { NextResponse } from 'next/server';
import { algoEngine } from '../../../models/algoEngine';

export async function GET() {
  try {
    const stocks = algoEngine.getStocks();
    const preOpenStocks = algoEngine.getPreOpenStocks();
    const isTradingActive = algoEngine.getTradingStatus();
    const isWsConnected = algoEngine.isWsConnected();
    return NextResponse.json({ success: true, stocks, preOpenStocks, isTradingActive, isWsConnected });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
