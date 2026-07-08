import { NextResponse } from 'next/server';
import { prisma } from '../../../../../database/db';
import { generateTOTP } from '../../../../../shared/services/totp';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await prisma.client.findUnique({
      where: { id },
      select: { zerodhaTotpSecret: true }
    });

    if (!client || !client.zerodhaTotpSecret) {
      return NextResponse.json({ success: false, error: 'TOTP Secret not configured' });
    }

    const code = generateTOTP(client.zerodhaTotpSecret);
    
    // Also return time remaining in current 30s window
    const epoch = Math.floor(Date.now() / 1000);
    const secondsRemaining = 30 - (epoch % 30);

    return NextResponse.json({ success: true, code, secondsRemaining });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Failed to generate TOTP' }, { status: 500 });
  }
}
