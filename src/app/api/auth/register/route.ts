import { NextResponse } from 'next/server';
import { prisma } from '../../../../database/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, userId, password } = body;

    if (!name || !email || !userId || !password) {
      return NextResponse.json({ success: false, error: 'Name, email, client ID, and password are required' }, { status: 400 });
    }

    // Check if email or userId is already taken
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { userId: userId }
        ]
      }
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'Email' : 'Client ID';
      return NextResponse.json({ success: false, error: `${field} is already registered` }, { status: 400 });
    }

    // Create the User record
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        userId: userId,
        password: password,
        role: 'client',
        status: 'active'
      }
    });

    // Create the Client record
    const newClient = await prisma.client.create({
      data: {
        userId: newUser.id,
        zerodhaClientId: userId, // Default Zerodha Client ID to the user ID
        capital: 0,
        tradingStatus: 'inactive',
        subscriptionStatus: 'pending'
      }
    });

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
