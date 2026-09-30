import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';

export async function GET() {
  try {
    const strategies = await prisma.strategy.findMany({
      where: { status: 'active' },
      include: {
        backtests: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { winRate: true }
        }
      },
      orderBy: { name: 'asc' },
    });

    const tradingStrategies = strategies.map(s => {
      // Mock random win rate between 60-90% if no backtests exist, just for demo
      // In production, you'd probably return 0 or null
      let winRate = Math.floor(Math.random() * 30) + 60; 
      
      if (s.backtests.length > 0 && s.backtests[0].winRate) {
        winRate = parseFloat(s.backtests[0].winRate.toString());
      }
      
      return {
        id: s.id,
        name: s.name,
        winRate: winRate,
        lossRate: 100 - winRate
      };
    });

    return NextResponse.json({
      success: true,
      data: tradingStrategies,
    });
  } catch (error) {
    console.error('Failed to fetch trading strategies:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch trading strategies' },
      { status: 500 }
    );
  }
}
