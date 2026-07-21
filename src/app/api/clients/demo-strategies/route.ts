export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '../../../../database/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { userId: userId },
          { email: userId }
        ]
      }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const client = await prisma.client.findFirst({
      where: { userId: user.id }
    });

    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    let strategies = await prisma.demoStrategy.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: 'desc' }
    });

    if (strategies.length === 0) {
      const defaultStrategy = await prisma.demoStrategy.create({
        data: {
          name: 'Pre-Open Gapdown',
          description: 'Pre-Open Momentum Breakout Strategy targeting high-gap stocks.',
          status: 'active',
          clientId: client.id,
          configJson: JSON.stringify({
            basicInfo: {
              name: 'Pre-Open Gapdown',
              description: 'Pre-Open Momentum Breakout Strategy targeting high-gap stocks.',
              tradeType: 'Intraday',
              exchange: 'NSE',
              segment: 'NSE F&O',
              preSelectTime: '09:15',
              exitTime: '15:15',
              maxTradesPerDay: 3,
              selectPosition: 2,
              checkIntervalSec: 60,
              status: 'active'
            },
            legs: [{
              name: 'Leg 1',
              enabled: true,
              entryTime: '09:20:30',
              timeframe: '5m',
              tradeAction: {
                action: 'Long',
                orderType: 'SL-Market',
                bufferPercent: 0.1,
                marketProtection: -1,
                candlePriceType: 'high'
              }
            }],
            stoploss: {
              type: 'Fixed %',
              orderType: 'Market',
              fixedPercent: 1,
              fixedPoints: 10,
              trailingSL: -1,
              riskPercent: 1.0
            },
            target: {
              type: 'Profit %',
              profitPercent: 2,
              riskRewardRatio: 2.0,
              partialExit: 100,
              trailingTarget: -1
            },
            riskManagement: {
              capitalAllocation: -1,
              riskPerTrade: 3,
              misMarginRate: 0.20,
              maxDailyLoss: -1,
              maxDailyProfit: -1,
              maxOpenPositions: 3,
              killSwitch: false
            },
            conditions: []
          })
        }
      });
      strategies = [defaultStrategy];
    }

    return NextResponse.json({ success: true, strategies });
  } catch (error: any) {
    console.error('Failed to fetch demo strategies:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, name, description, status, configJson } = await request.json();

    if (!userId || !name) {
      return NextResponse.json({ success: false, error: 'User ID and Strategy Name are required' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { userId: userId },
          { email: userId }
        ]
      }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const client = await prisma.client.findFirst({
      where: { userId: user.id }
    });

    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    const newStrategy = await prisma.demoStrategy.create({
      data: {
        name,
        description,
        status: status || 'inactive',
        configJson,
        clientId: client.id
      }
    });

    return NextResponse.json({ success: true, strategy: newStrategy });
  } catch (error: any) {
    console.error('Failed to create demo strategy:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
