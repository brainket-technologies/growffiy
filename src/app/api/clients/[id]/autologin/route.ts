import { NextResponse } from 'next/server';
import { performKiteAutoLogin } from '../../../../../shared/services/kiteAutoLogin';
import { prisma } from '../../../../../database/db';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    if (!client.zerodhaTotpSecret || !client.zerodhaPassword || !client.zerodhaClientId) {
      return NextResponse.json({ success: false, error: 'Missing TOTP Secret, Password or Client ID for auto-login' }, { status: 400 });
    }

    const loginRes = await performKiteAutoLogin(id);

    if (loginRes.success && loginRes.accessToken) {
      return NextResponse.json({ success: true, accessToken: loginRes.accessToken });
    } else {
      return NextResponse.json({ success: false, error: loginRes.error || 'Auto-login failed' }, { status: 400 });
    }

  } catch (err: any) {
    console.error('API Autologin error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
