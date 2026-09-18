import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'growffi-secret-key-fallback';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, otp } = body;

    if (!identifier || !otp) {
      return NextResponse.json(
        { success: false, error: 'Identifier and OTP are required' },
        { status: 400 }
      );
    }

    // Find user by identifier
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { userId: identifier },
          { client: { zerodhaClientId: identifier } }
        ]
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid identifier or OTP' },
        { status: 400 }
      );
    }

    // Check if OTP matches and is not expired
    if (!user.resetOtp || user.resetOtp !== otp) {
      return NextResponse.json(
        { success: false, error: 'Invalid OTP' },
        { status: 400 }
      );
    }

    if (!user.resetOtpExpiry || new Date() > user.resetOtpExpiry) {
      return NextResponse.json(
        { success: false, error: 'OTP has expired' },
        { status: 400 }
      );
    }

    // OTP is valid. Generate a temporary reset token (valid for 15 mins)
    // This token allows them to hit the /reset-password endpoint without logging in
    const resetToken = jwt.sign(
      { id: user.id, purpose: 'password_reset' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'OTP verified successfully',
        data: {
          resetToken
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
