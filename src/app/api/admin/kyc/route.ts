import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import { KiteClient } from '@/shared/services/kite';

export async function GET(request: Request) {
  try {
    const clients = await prisma.client.findMany({
      where: {
        kycStatus: { in: ['pending', 'under_review'] }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            userId: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Enrich with live margin where access token exists
    const enriched = await Promise.all(
      clients.map(async (client) => {
        let liveMargin: number | null = null;
        let kiteSessionActive = false;

        if (client.accessToken && client.zerodhaApiKey) {
          try {
            const marginPromise = KiteClient.getMargins(client.zerodhaApiKey, client.accessToken);
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000));
            const margins: any = await Promise.race([marginPromise, timeoutPromise]);
            
            liveMargin = margins?.net ?? null;
            kiteSessionActive = true;
          } catch {
            kiteSessionActive = false;
          }
        }

        return {
          ...client,
          liveMargin,
          kiteSessionActive,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enriched
    });
  } catch (error: any) {
    console.error('Fetch pending KYC requests error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientId, status } = body;

    if (!clientId || !status || (status !== 'verified' && status !== 'rejected')) {
      return NextResponse.json(
        { success: false, error: 'Invalid input. Missing clientId or invalid status.' },
        { status: 400 }
      );
    }

    const client = await prisma.client.update({
      where: { id: clientId },
      data: { kycStatus: status }
    });

    return NextResponse.json({
      success: true,
      message: `KYC request ${status} successfully.`,
      data: client
    });
  } catch (error: any) {
    console.error('Update KYC status error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
