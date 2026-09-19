import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'growffi-secret-key-fallback';
export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const tokenUserId = decoded.id || decoded.userId;
    if (!tokenUserId) {
      return NextResponse.json({ success: false, error: 'Invalid token payload' }, { status: 401 });
    }

    // 2. Fetch User with Client and active Subscription
    const user = await prisma.user.findUnique({ 
      where: { id: tokenUserId },
      include: {
        client: true,
        subscriptions: {
          where: { status: 'active' },
          orderBy: { endDate: 'desc' },
          take: 1,
          include: {
            plan: true,
          }
        }
      }
    });

    if (!user || !user.client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    const client = user.client;

    // 3. Prepare Plan Details
    let activePlanName = 'No Active Plan';
    let planIsActive = false;
    let startDate = null;
    let expiryDate = null;
    let expiryWarning = false;
    let expiryWarningMessage = '';

    if (user.subscriptions && user.subscriptions.length > 0) {
      const sub = user.subscriptions[0];
      activePlanName = sub.plan.name;
      planIsActive = true;
      startDate = sub.startDate;
      expiryDate = sub.endDate;

      // Check if expiry is within 7 days
      const daysToExpiry = Math.ceil((sub.endDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      if (daysToExpiry <= 7 && daysToExpiry >= 0) {
        expiryWarning = true;
        expiryWarningMessage = `Your plan expires in ${daysToExpiry} day(s). Renew soon!`;
      } else if (daysToExpiry < 0) {
        expiryWarning = true;
        expiryWarningMessage = `Your plan has expired. Please renew.`;
        planIsActive = false; // Expired
      }
    }

    // 4. Check Kite Connection Status
    const isKiteConnected = Boolean(client.zerodhaClientId && client.accessToken);
    const kiteConnectionStatus = isKiteConnected ? 'Connected' : 'Disconnected';

    return NextResponse.json({
      success: true,
      data: {
        activePlanName,
        planIsActive,
        startDate,
        expiryDate,
        expiryWarning,
        expiryWarningMessage,
        isKiteConnected,
        kiteConnectionStatus,
      },
    });
  } catch (error: any) {
    console.error('Current Plan API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
