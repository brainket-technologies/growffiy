import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import jwt from 'jsonwebtoken';

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

    await prisma.client.update({
      where: { userId: decoded.id },
      data: {
        zerodhaTotpSecret: totpSecret,
      },
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
