import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { performKiteAutoLogin } from '../../../../lib/kiteAutoLogin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const cronSecret = process.env.CRON_SECRET || 'growffiy_cron_secret';

    if (secret !== cronSecret) {
      return NextResponse.json({ success: false, error: 'Unauthorized cron execution' }, { status: 401 });
    }

    // Find all active, subscribed clients who have auto-login credentials
    const clients = await prisma.client.findMany({
      where: {
        tradingStatus: 'active',
        subscriptionStatus: 'active',
        zerodhaPassword: { not: null },
        zerodhaTotpSecret: { not: null },
        zerodhaClientId: { not: null }
      },
      include: {
        user: true
      }
    });

    console.log(`Cron Refresh Tokens: Found ${clients.length} clients to refresh session tokens.`);

    const results = [];

    for (const client of clients) {
      try {
        console.log(`Cron Refresh Tokens: Attempting auto-login for ${client.user.name} (${client.zerodhaClientId})...`);
        const loginRes = await performKiteAutoLogin(client.id);
        
        results.push({
          clientId: client.id,
          name: client.user.name,
          zerodhaClientId: client.zerodhaClientId,
          success: loginRes.success,
          error: loginRes.error || null
        });
      } catch (err: any) {
        console.error(`Cron Refresh Tokens: Error auto-logging in client ${client.user.name}:`, err);
        results.push({
          clientId: client.id,
          name: client.user.name,
          zerodhaClientId: client.zerodhaClientId,
          success: false,
          error: err.message || 'Internal execution error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      details: results
    });

  } catch (error: any) {
    console.error('Session refresh cron execution error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
