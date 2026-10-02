import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import { sendEmail } from '../../../../../shared/services/mailer';
import bcrypt from 'bcryptjs';
import { encryptText } from '../../../../../shared/utils/crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { fullName, email, password, productType, tradingStrategies, referralCode } = body;

    if (email) email = email.trim();
    if (fullName) fullName = fullName.trim();
    if (referralCode) referralCode = referralCode.trim();

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    let user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } }
    });

    if (user) {
      if (user.isBlocked) {
        return NextResponse.json(
          { success: false, error: 'Your account has been blocked. Please contact support.' },
          { status: 403 }
        );
      }
      if (user.isDeleted) {
        return NextResponse.json(
          { success: false, error: 'This account no longer exists. Please contact support.' },
          { status: 403 }
        );
      }
      if (user.status === 'active') {
        return NextResponse.json(
          { success: false, error: 'Email already registered and active. Please login.' },
          { status: 400 }
        );
      }
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiry = new Date(Date.now() + 10 * 60000); // 10 mins
    
    // Hash password using AES (New Standard)
    const encryptedPassword = encryptText(password);
    // Generate clean userId based on name
    const cleanName = fullName.replace(/\s+/g, '').toLowerCase().substring(0, 5);
    const generatedUserId = `${cleanName}${Math.floor(100 + Math.random() * 900)}`;
    
    if (user && user.status !== 'active') {
      // Update pending user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: fullName,
          password: encryptedPassword,
          resetOtp: otp,
          resetOtpExpiry: expiry
        }
      });
    } else {
      // Create new pending user
      user = await prisma.user.create({
        data: {
          name: fullName,
          email: email.toLowerCase().trim(),
          userId: generatedUserId,
          password: encryptedPassword,
          status: 'pending',
          resetOtp: otp,
          resetOtpExpiry: expiry
        }
      });
    }

    // Validate referralCode (Staff ID) if provided
    let validStaffId = null;
    if (referralCode) {
      const staff = await prisma.staff.findUnique({ where: { id: referralCode } });
      if (staff) validStaffId = staff.id;
    }

    // Ensure Client exists and store productType and strategies
    let client = await prisma.client.findUnique({
      where: { userId: user.id }
    });

    if (client) {
      client = await prisma.client.update({
        where: { id: client.id },
        data: {
          productTypeId: productType || null,
          ...(validStaffId ? { addedByStaffId: validStaffId } : {})
        }
      });
    } else {
      client = await prisma.client.create({
        data: {
          userId: user.id,
          capital: 0,
          tradingStatus: 'inactive',
          subscriptionStatus: 'pending',
          kycStatus: 'pending',
          productTypeId: productType || null,
          addedByStaffId: validStaffId,
        }
      });
    }

    // Handle tradingStrategies
    if (tradingStrategies && Array.isArray(tradingStrategies)) {
      await prisma.strategyAssignment.deleteMany({
        where: { clientId: client.id }
      });
      
      if (tradingStrategies.length > 0) {
        await prisma.strategyAssignment.createMany({
          data: tradingStrategies.map((sId: string) => ({
            clientId: client!.id,
            strategyId: sId,
            status: 'active'
          }))
        });
      }
    }

    const emailResult = await sendEmail({
      to: user.email,
      subject: "Growffi - Registration OTP",
      text: `Your OTP for registration is ${otp}. It will expire in 10 minutes.`,
      html: `<p>Your OTP for registration is <b>${otp}</b>.</p><p>It will expire in 10 minutes.</p>`,
    });

    if (!emailResult.success) {
      console.warn("Failed to send OTP email:", emailResult.error || emailResult.message);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'OTP sent to your email',
        data: {
          userId: user.id
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
