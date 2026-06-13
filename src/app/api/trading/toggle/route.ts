import { NextResponse } from 'next/server';
import { algoEngine } from '../../../../models/algoEngine';

export async function POST(request: Request) {
  try {
    const { active } = await request.json();
    algoEngine.toggleTrading(active);
    
    // If turning active, run pre-open trade setup simulation immediately for demo purposes
    if (active) {
      await algoEngine.executePreOpenTrades('system-admin-mock');
    }
    
    return NextResponse.json({ success: true, isTradingActive: algoEngine.getTradingStatus() });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
