import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import jwt from 'jsonwebtoken';
import { performKiteAutoLogin } from '../../../../../shared/services/kiteAutoLogin';

const JWT_SECRET = process.env.JWT_SECRET || 'growffi-secret-key-fallback';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Missing or invalid token format' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body; // 'connect' or 'disconnect'

    if (action !== 'connect' && action !== 'disconnect') {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be connect or disconnect' },
        { status: 400 }
      );
    }

    // First find the user and their associated client
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { client: true }
    });

    if (!user || !user.client) {
      return NextResponse.json(
        { success: false, error: 'User or client record not found' },
        { status: 404 }
      );
    }

    const clientId = user.client.id;

    if (action === 'disconnect') {
      // Disconnect Zerodha by nullifying accessToken
      await prisma.client.update({
        where: { id: clientId },
        data: { accessToken: null }
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Zerodha session disconnected successfully',
        },
        { status: 200 }
      );
    } else if (action === 'connect') {
      if (!user.client.zerodhaTotpSecret || !user.client.zerodhaPassword || !user.client.zerodhaClientId) {
        return NextResponse.json({ success: false, error: 'Missing TOTP Secret, Password or Client ID for auto-login' }, { status: 400 });
      }

      const loginRes = await performKiteAutoLogin(clientId);

      if (loginRes.success && loginRes.accessToken) {
        return NextResponse.json({ success: true, accessToken: loginRes.accessToken, message: 'Zerodha connected successfully' });
      } else {
        return NextResponse.json({ success: false, error: loginRes.error || 'Auto-login failed' }, { status: 400 });
      }
    }

  } catch (error: any) {
    console.error('Zerodha Connection error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
