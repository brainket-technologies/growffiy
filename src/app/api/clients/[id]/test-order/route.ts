import { NextResponse } from 'next/server';
import { prisma } from '../../../../../database/db';
import { KiteClient } from '../../../../../shared/services/kite';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json({ success: false, error: 'Symbol parameter is required' }, { status: 400 });
    }

    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client || !client.zerodhaApiKey || !client.accessToken) {
      return NextResponse.json({ success: false, error: 'Client session active nahi hai' }, { status: 400 });
    }

    const exchange = searchParams.get('exchange') || 'NSE';
    const ins = `${exchange}:${symbol.toUpperCase()}`;

    const proxyTarget = client.proxyUrl || client.dedicatedIp;
    const { algoEngine } = require('../../../../../shared/models/algoEngine');

    // 1. Try fetching live quote with current client credentials
    try {
      const quoteRes = await KiteClient.getQuotes(
        client.zerodhaApiKey,
        client.accessToken,
        [ins],
        proxyTarget
      );

      if (quoteRes?.status === 'success' && quoteRes.data && quoteRes.data[ins]) {
        const q = quoteRes.data[ins];
        if (q.last_price && q.last_price > 0) {
          return NextResponse.json({
            success: true,
            symbol: symbol.toUpperCase(),
            lastPrice: q.last_price,
            ohlc: q.ohlc,
            quote: q
          });
        }
      }
    } catch (err) {
      console.warn(`[Test Order] Individual client getQuotes failed for ${ins}:`, err);
    }

    // 2. Try fetching live quote using Primary Master Account (from settings / master_scanner_client_id)
    try {
      const masterSetting = await prisma.appSettings.findUnique({
        where: { settingKey: 'master_scanner_client_id' }
      });
      let masterClient = null;
      if (masterSetting?.settingValue) {
        masterClient = await prisma.client.findFirst({
          where: {
            OR: [
              { id: masterSetting.settingValue },
              { zerodhaClientId: masterSetting.settingValue }
            ],
            accessToken: { not: null },
            zerodhaApiKey: { not: null }
          }
        });
      }
      if (!masterClient) {
        masterClient = await prisma.client.findFirst({
          where: { accessToken: { not: null }, zerodhaApiKey: { not: null } }
        });
      }

      if (masterClient && masterClient.zerodhaApiKey && masterClient.accessToken) {
        const masterProxy = masterClient.proxyUrl || masterClient.dedicatedIp;
        const masterQuoteRes = await KiteClient.getQuotes(
          masterClient.zerodhaApiKey,
          masterClient.accessToken,
          [ins],
          masterProxy
        );
        if (masterQuoteRes?.status === 'success' && masterQuoteRes.data && masterQuoteRes.data[ins]) {
          const q = masterQuoteRes.data[ins];
          if (q.last_price && q.last_price > 0) {
            return NextResponse.json({
              success: true,
              symbol: symbol.toUpperCase(),
              lastPrice: q.last_price,
              source: 'masterClient'
            });
          }
        }
      }
    } catch (mErr) {
      console.warn(`[Test Order] Master client getQuotes failed for ${ins}:`, mErr);
    }

    // 3. Fallback: Check local algoEngine stock quotes memory
    const stocks = algoEngine.getStocks();
    const matched = stocks.find((s: any) => (s.symbol || s.tradingsymbol || '').toUpperCase() === symbol.toUpperCase());

    if (matched && matched.lastPrice) {
      return NextResponse.json({
        success: true,
        symbol: symbol.toUpperCase(),
        lastPrice: matched.lastPrice,
        source: 'algoEngine'
      });
    }

    return NextResponse.json({
      success: false,
      lastPrice: 0,
      error: 'Quote unavailable'
    });
  } catch (err: any) {
    console.error('API Quote error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { tradingsymbol, transaction_type, order_type, quantity, price, product, exchange } = body;

    if (!tradingsymbol || !quantity) {
      return NextResponse.json({ success: false, error: 'Trading symbol and quantity are required' }, { status: 400 });
    }

    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    if (!client.zerodhaApiKey || !client.accessToken) {
      return NextResponse.json({ success: false, error: 'Client session active nahi hai (AccessToken / API Key missing)' }, { status: 400 });
    }

    const orderParams: any = {
      exchange: exchange || 'NSE',
      tradingsymbol: String(tradingsymbol).trim().toUpperCase(),
      transaction_type: (transaction_type || 'BUY').toUpperCase() as 'BUY' | 'SELL',
      quantity: Number(quantity),
      order_type: (order_type || 'MARKET').toUpperCase() as 'MARKET' | 'LIMIT' | 'SL' | 'SL-M',
      product: (product || 'MIS').toUpperCase() as 'MIS' | 'CNC' | 'NRML',
      validity: 'DAY' as const,
    };

    if (orderParams.order_type === 'MARKET') {
      orderParams.market_protection = 5;
    }

    if (orderParams.order_type === 'LIMIT' && price) {
      orderParams.price = Number(price);
    }

    const proxyTarget = client.proxyUrl || client.dedicatedIp;

    console.log(`[Test Order] Placing test ${orderParams.transaction_type} order for client ${client.zerodhaClientId} (${orderParams.tradingsymbol})...`);
    const kiteRes = await KiteClient.placeOrder(
      client.zerodhaApiKey,
      client.accessToken,
      orderParams,
      proxyTarget
    );

    if (kiteRes?.status === 'success' && kiteRes.data?.order_id) {
      return NextResponse.json({
        success: true,
        orderId: kiteRes.data.order_id,
        message: `Order placed successfully! Order ID: ${kiteRes.data.order_id}`,
        rawResponse: kiteRes
      });
    } else {
      return NextResponse.json({
        success: false,
        error: kiteRes?.message || 'Zerodha order placement failed',
        rawResponse: kiteRes
      }, { status: 400 });
    }

  } catch (err: any) {
    console.error('API Test Order error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
