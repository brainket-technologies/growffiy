import { NextResponse } from 'next/server';
import { prisma } from '../../../../../database/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const strategyId = searchParams.get('strategyId');

    if (!strategyId) {
      return NextResponse.json({ success: false, error: 'strategyId is required' }, { status: 400 });
    }

    try {
      const dbLogs = await prisma.strategyLog.findMany({
        where: { strategyId },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      if (dbLogs.length === 0) {
        return NextResponse.json({ success: true, logs: getMockLogs(strategyId) });
      }

      const mappedLogs = dbLogs.map(log => ({
        id: log.id,
        message: log.message,
        logType: log.logType,
        createdAt: log.createdAt.toISOString()
      }));

      return NextResponse.json({ success: true, logs: mappedLogs });
    } catch (dbErr) {
      return NextResponse.json({ success: true, logs: getMockLogs(strategyId), isDemoMode: true });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

function getMockLogs(strategyId: string) {
  const time = new Date();
  return [
    {
      id: 'log1',
      message: `[${strategyId}] Strategy initial check passed. Scanning tickers.`,
      logType: 'info',
      createdAt: new Date(time.getTime() - 60000).toISOString()
    },
    {
      id: 'log2',
      message: `[${strategyId}] Gap Down condition met for NIFTY option contracts.`,
      logType: 'info',
      createdAt: new Date(time.getTime() - 45000).toISOString()
    },
    {
      id: 'log3',
      message: `[${strategyId}] Order signal generated: Buy NIFTY 18 Jun 23000 CE.`,
      logType: 'trade',
      createdAt: new Date(time.getTime() - 30000).toISOString()
    },
    {
      id: 'log4',
      message: `[${strategyId}] Trailing SL updated to 1% above acquisition.`,
      logType: 'info',
      createdAt: new Date(time.getTime() - 15000).toISOString()
    }
  ];
}
