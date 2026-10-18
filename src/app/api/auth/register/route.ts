import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import { encryptText } from '../../../../shared/utils/crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { name, fullName, email, userId, password, referralCode, productType, tradingStrategies } = body;

    const finalName = (fullName || name || '').trim();
    const finalEmail = (email || '').trim().toLowerCase();
    const cleanPassword = password ? password.trim() : '';

    if (!finalName || !finalEmail || !cleanPassword) {
      return NextResponse.json(
        { success: false, error: 'Full name, email, and password are required' },
        { status: 400 }
      );
    }

    // Determine or generate unique userId (Client ID)
    let finalUserId = (userId || '').trim().toUpperCase();
    if (!finalUserId) {
      const cleanName = finalName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 5) || 'user';
      let candidate = `${cleanName}${Math.floor(100 + Math.random() * 900)}`.toUpperCase();
      let exists = await prisma.user.findFirst({ where: { userId: candidate } });
      while (exists) {
        candidate = `${cleanName}${Math.floor(1000 + Math.random() * 9000)}`.toUpperCase();
        exists = await prisma.user.findFirst({ where: { userId: candidate } });
      }
      finalUserId = candidate;
    }

    // Check if email or userId is already taken
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: finalEmail, mode: 'insensitive' } },
          { userId: finalUserId }
        ]
      }
    });

    if (existingUser) {
      const field = existingUser.email.toLowerCase() === finalEmail ? 'Email' : 'Client ID';
      return NextResponse.json({ success: false, error: `${field} is already registered` }, { status: 400 });
    }

    // Validate referral code (Staff ID) if provided
    let validStaffId = null;
    if (referralCode && typeof referralCode === 'string' && referralCode.trim()) {
      const staff = await prisma.staff.findUnique({ where: { id: referralCode.trim() } });
      if (staff) validStaffId = staff.id;
    }

    // Encrypt password
    const encryptedPassword = encryptText(cleanPassword);

    // Create the User record
    const newUser = await prisma.user.create({
      data: {
        name: finalName,
        email: finalEmail,
        userId: finalUserId,
        password: encryptedPassword,
        role: 'client',
        status: 'active'
      }
    });

    // Create the Client record
    const newClient = await prisma.client.create({
      data: {
        userId: newUser.id,
        zerodhaClientId: finalUserId,
        capital: 0,
        tradingStatus: 'inactive',
        subscriptionStatus: 'pending',
        kycStatus: 'unverified',
        productTypeId: productType || null,
        addedByStaffId: validStaffId,
      }
    });

    // Handle tradingStrategies (empty array if none)
    if (tradingStrategies && Array.isArray(tradingStrategies) && tradingStrategies.length > 0) {
      await prisma.strategyAssignment.createMany({
        data: tradingStrategies.map((sId: string) => ({
          clientId: newClient.id,
          strategyId: sId,
          status: 'active'
        }))
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Account registered successfully! Redirecting to login...',
      user: {
        id: newUser.id,
        name: newUser.name,
        userId: newUser.userId
      }
    });
  } catch (error: any) {
    console.error('Registration failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'Registration failed' }, { status: 500 });
  }
}
