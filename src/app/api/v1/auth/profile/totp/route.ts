import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import jwt from 'jsonwebtoken';
import { performKiteAutoLogin } from '../../../../../../shared/services/kiteAutoLogin';

const JWT_SECRET = process.env.JWT_SECRET || 'growffi-secret-key-fallback';

export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Missing or invalid token format' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { totpSecret } = body;

    if (!totpSecret || typeof totpSecret !== 'string' || totpSecret.trim().length < 16) {
      return NextResponse.json({ success: false, error: 'Invalid TOTP secret. Must be at least 16 characters.' }, { status: 400 });
    }

    // Validate it's valid base32 (TOTP secrets are base32 encoded)
    const cleanSecret = totpSecret.trim().toUpperCase().replace(/\s+/g, '');
    if (!/^[A-Z2-7]+=*$/.test(cleanSecret)) {
      return NextResponse.json({ success: false, error: 'Invalid TOTP secret format. Must be a valid base32 string.' }, { status: 400 });
    }

    // Get client record to fetch clientId
    const client = await prisma.client.findUnique({
      where: { userId: decoded.id },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json({ success: false, error: 'Client record not found.' }, { status: 404 });
    }

    // ── Step 1: Verify Kite login with new secret BEFORE saving ──
    if (process.env.KITE_AUTO_LOGIN_ENABLED === 'true') {
      const loginResult = await performKiteAutoLogin(client.id, cleanSecret);

      if (!loginResult.success || !loginResult.accessToken) {
        // Login failed — do NOT save TOTP secret
        return NextResponse.json(
          { success: false, error: loginResult.error || 'Kite auto-login failed. TOTP secret was not saved.' },
          { status: 400 }
        );
      }

      // ── Step 2: Login succeeded — now save TOTP + accessToken atomically ──
      await prisma.client.update({
        where: { id: client.id },
        data: {
          zerodhaTotpSecret: cleanSecret,
          accessToken: loginResult.accessToken,
        },
      });

      return NextResponse.json(
        { success: true, message: 'TOTP saved & Kite login successful!' },
        { status: 200 }
      );
    }

    // Fallback: auto-login disabled, just save TOTP secret
    await prisma.client.update({
      where: { id: client.id },
      data: { zerodhaTotpSecret: cleanSecret },
    });

    return NextResponse.json(
      { success: true, message: 'TOTP settings updated successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update TOTP settings error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
