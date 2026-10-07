import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import { KiteClient } from '@/shared/services/kite';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'growffi-secret-key-fallback';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tradeId } = body;

    if (!tradeId) {
      return NextResponse.json({ success: false, error: 'Trade ID is required' }, { status: 400 });
    }

    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: { client: true },
    });

    if (!trade) {
      return NextResponse.json({ success: false, error: 'Trade not found' }, { status: 404 });
    }

    if (trade.status !== 'open') {
      return NextResponse.json({ success: false, error: 'Trade is already closed or cancelled' }, { status: 400 });
    }

    const client = trade.client;
    if (!client || !client.zerodhaApiKey || !client.accessToken) {
      return NextResponse.json({ success: false, error: 'Client Kite credentials not found' }, { status: 400 });
    }

    const apiKey = client.zerodhaApiKey;
    const accessToken = client.accessToken;
    const vpsIp = client.proxyUrl || client.dedicatedIp;

    // Helper to safely cancel orders
    const safeCancel = async (orderId: string) => {
      if (!orderId) return;
      try {
        await KiteClient.cancelOrder(apiKey, accessToken, orderId, 'regular', vpsIp);
      } catch (e: any) {
        console.warn(`Could not cancel order ${orderId}:`, e.message);
      }
    };

    let filledQuantity = 0;
    let entryStatus = trade.entryOrderStatus || 'OPEN';
    let productType = 'MIS'; // Default to MIS unless we find out from Kite
    let kiteExchange = 'NSE';
    let kiteTradingsymbol = trade.symbol;

    // Step 1: Check live entry order status if we have the entry order ID
    if (trade.entryOrderId) {
      try {
        const orderRes = await KiteClient.getOrderById(apiKey, accessToken, trade.entryOrderId, vpsIp);
        if (orderRes && orderRes.data && Array.isArray(orderRes.data) && orderRes.data.length > 0) {
          const latestState = orderRes.data[orderRes.data.length - 1];
          entryStatus = latestState.status;
          filledQuantity = Number(latestState.filled_quantity) || 0;
          if (latestState.product) productType = latestState.product;
          if (latestState.exchange) kiteExchange = latestState.exchange;
          if (latestState.tradingsymbol) kiteTradingsymbol = latestState.tradingsymbol;
        }
      } catch (e: any) {
        console.warn('Failed to fetch live entry order, relying on DB state');
        filledQuantity = Number(trade.quantity);
      }
    } else {
      filledQuantity = Number(trade.quantity);
    }

    // Step 2: Handle based on filled quantity
    if (filledQuantity === 0) {
      // Not executed at all - cancel entry order
      await safeCancel(trade.entryOrderId || '');
      
      await prisma.trade.update({
        where: { id: tradeId },
        data: {
          status: 'cancelled',
          entryOrderStatus: 'CANCELLED',
          exitReason: 'Manual Force Cancel',
          exitTime: new Date(),
        },
      });

      return NextResponse.json({ success: true, message: 'Pending entry order cancelled.' });
    }

    // It is partially or fully filled.
    // If partially filled, cancel the remaining entry order leg
    if (entryStatus === 'OPEN' || entryStatus === 'UPDATE' || entryStatus === 'PARTIALLY_FILLED') {
      await safeCancel(trade.entryOrderId || '');
    }

    // Cancel SL and Target
    let slCompleted = false;
    let targetCompleted = false;

    if (trade.slOrderId) {
      try {
        const slRes = await KiteClient.getOrderById(apiKey, accessToken, trade.slOrderId, vpsIp);
        if (slRes && slRes.data && slRes.data.length > 0) {
          if (slRes.data[slRes.data.length - 1].status === 'COMPLETE') slCompleted = true;
        }
        if (!slCompleted) await safeCancel(trade.slOrderId);
      } catch (e) {
        await safeCancel(trade.slOrderId);
      }
    }

    if (trade.targetOrderId) {
      try {
        const tgtRes = await KiteClient.getOrderById(apiKey, accessToken, trade.targetOrderId, vpsIp);
        if (tgtRes && tgtRes.data && tgtRes.data.length > 0) {
          if (tgtRes.data[tgtRes.data.length - 1].status === 'COMPLETE') targetCompleted = true;
        }
        if (!targetCompleted) await safeCancel(trade.targetOrderId);
      } catch (e) {
        await safeCancel(trade.targetOrderId);
      }
    }

    // Race condition check
    if (slCompleted || targetCompleted) {
      await prisma.trade.update({
        where: { id: tradeId },
        data: {
          status: 'closed',
          exitReason: slCompleted ? 'SL Hit' : 'Target Hit',
          exitTime: new Date(),
        },
      });
      return NextResponse.json({ success: true, message: 'Trade already closed via SL/Target on Kite.' });
    }

    // Step 3: Place Market Exit Order
    const direction = trade.direction || 'BUY';
    const exitDirection = direction.toUpperCase() === 'BUY' || direction.toUpperCase() === 'LONG' ? 'SELL' : 'BUY';
    
    let marketExitRes;
    try {
      let exchange = kiteExchange;
      let tradingsymbol = kiteTradingsymbol;
      
      // If we couldn't fetch from Kite, fallback to parsing trade.symbol
      if (exchange === 'NSE' && tradingsymbol === trade.symbol) {
        if (trade.symbol.includes(':')) {
          const parts = trade.symbol.split(':');
          exchange = parts[0];
          tradingsymbol = parts[1];
        } else if (trade.symbol.length > 10 || trade.symbol.includes('PE') || trade.symbol.includes('CE') || trade.symbol.includes('FUT')) {
          exchange = 'NFO';
        }
      }

      marketExitRes = await KiteClient.placeOrder(
        apiKey,
        accessToken,
        {
          exchange: exchange,
          tradingsymbol: tradingsymbol,
          transaction_type: exitDirection,
          quantity: Number(filledQuantity),
          order_type: 'MARKET',
          product: productType as 'MIS' | 'CNC' | 'NRML',
          variety: 'regular'
        },
        vpsIp
      );
    } catch (e: any) {
      return NextResponse.json({ success: false, error: 'Failed to place exit order: ' + e.message }, { status: 500 });
    }

    if (!marketExitRes || marketExitRes.status !== 'success') {
      return NextResponse.json({ success: false, error: 'Kite returned failure for exit order' }, { status: 500 });
    }

    const exitOrderId = marketExitRes.data.order_id;
    let exitPrice = trade.entryPrice; // Fallback

    try {
      // Wait a moment for order to execute, then fetch price
      await new Promise(r => setTimeout(r, 1000));
      const exitOrderState = await KiteClient.getOrderById(apiKey, accessToken, exitOrderId, vpsIp);
      if (exitOrderState && exitOrderState.data && exitOrderState.data.length > 0) {
        const latest = exitOrderState.data[exitOrderState.data.length - 1];
        if (latest.status === 'COMPLETE') {
          exitPrice = latest.average_price;
        }
      }
    } catch (e) {
      console.warn('Could not fetch exact exit price for ', exitOrderId);
    }

    // Calculate P&L
    const isShort = (trade.direction || '').toUpperCase() === 'SHORT' || (trade.direction || '').toUpperCase() === 'SELL';
    const entry = Number(trade.entryPrice);
    const exit = Number(exitPrice);
    const qty = Number(filledQuantity);
    const pnl = isShort ? (entry - exit) * qty : (exit - entry) * qty;

    await prisma.trade.update({
      where: { id: tradeId },
      data: {
        status: 'closed',
        exitPrice: exit,
        exitTime: new Date(),
        exitReason: 'Manual Force Exit',
        pnl: pnl,
      }
    });

    return NextResponse.json({ success: true, message: 'Trade force exited successfully' });
  } catch (error: any) {
    console.error('Error in force exit API:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
