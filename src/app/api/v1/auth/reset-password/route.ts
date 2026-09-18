import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import jwt from 'jsonwebtoken';
import { encryptText } from '../../../../../shared/utils/crypto';

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
    } catch (err) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired reset token' },
        { status: 401 }
      );
    }

    if (decoded.purpose !== 'password_reset') {
      return NextResponse.json(
        { success: false, error: 'Invalid token purpose' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { newPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const userId = decoded.id;

    // Encrypt the new password
    const encryptedPassword = encryptText(newPassword);

    // Update user password and clear OTP
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: encryptedPassword,
        resetOtp: null,
        resetOtpExpiry: null,
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Password reset successfully',
        data: {}
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
