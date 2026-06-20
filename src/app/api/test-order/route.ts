import { NextResponse } from 'next/server';
import { prisma } from '../../../database/db';
import { KiteClient } from '../../../shared/services/kite';

export async function GET() {
  try {
    const client = await prisma.client.findFirst({
      where: { zerodhaClientId: 'RZJ500' }
    });

    if (!client) {
      return NextResponse.json({ 
        success: false, 
        error: 'Client RZJ500 not found in database.' 
      }, { status: 404 });
    }

    if (!client.accessToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'Client accessToken is null. Please connect Zerodha first from the client panel.' 
      }, { status: 400 });
    }

    console.log(`Live Server Order Test: Placing test order for client: ${client.zerodhaClientId}`);
    const orderRes = await KiteClient.placeOrder(client.zerodhaApiKey!, client.accessToken!, {
      exchange: 'NSE',
      tradingsymbol: 'TATASTEEL',
      transaction_type: 'BUY',
      quantity: 1,
      order_type: 'LIMIT',
      product: 'CNC',
      validity: 'DAY',
      price: 100.0
    });

    // Save trade in Database referencing the client's assigned strategy ID
    const strategyId = client.strategyId || (await prisma.strategy.findFirst())?.id || '';
    
    await prisma.trade.create({
      data: {
        clientId: client.id,
        strategyId: strategyId,
        symbol: 'TATASTEEL',
        orderType: 'LIMIT',
        entryPrice: 100.0,
        quantity: 1,
        stopLoss: 99.0,
        target: 102.0,
        status: orderRes.status === 'success' ? 'open' : 'failed',
        entryTime: new Date(),
        kiteResponse: orderRes
      }
    });

    return NextResponse.json({
      success: orderRes.status === 'success',
      message: 'Test order request completed and saved to database.',
      response: orderRes
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || String(error),
      stack: error.stack || ''
    }, { status: 500 });
  }
}
