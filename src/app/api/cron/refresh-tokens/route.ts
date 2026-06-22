import { NextResponse } from 'next/server';
import { prisma } from '../../../../database/db';
import { performKiteAutoLogin } from '../../../../shared/services/kiteAutoLogin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const cronSecret = process.env.CRON_SECRET || 'growffiy_cron_secret';

    if (secret !== cronSecret) {
      return NextResponse.json({ success: false, error: 'Unauthorized cron execution' }, { status: 401 });
    }

    const algoType = await prisma.productType.findUnique({ where: { name: 'Algo' } });
    if (!algoType) {
      return NextResponse.json({ success: false, error: 'Algo product type not found in database' }, { status: 500 });
    }

    // Find all active, subscribed Algo clients with Kite credentials
    const clients = await prisma.client.findMany({
      where: {
        tradingStatus: 'active',
        subscriptionStatus: 'active',
        productTypeId: algoType.id,
        zerodhaClientId: { not: null },
        zerodhaApiKey: { not: null },
        zerodhaApiSecret: { not: null },
        zerodhaPassword: { not: null },
        zerodhaTotpSecret: { not: null }
      },
      include: {
        user: true,
        productType: true
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
