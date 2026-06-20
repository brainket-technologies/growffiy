import { NextResponse } from 'next/server';
import { prisma } from '../../../../database/db';

export async function POST(request: Request) {
  try {
    const { userId, password, role } = await request.json();

    if (!userId || !password) {
      return NextResponse.json({ success: false, error: 'User ID and password are required' }, { status: 400 });
    }

    // Try to find the user in Neon DB
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { userId: userId },
          { email: userId }
        ]
      }
    });

    if (!user || user.password !== password) {
      return NextResponse.json({ success: false, error: 'Invalid User ID/Email or Password' }, { status: 401 });
    }

    if (role && user.role !== role) {
      return NextResponse.json({ success: false, error: 'Unauthorized role assignment access' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        userId: user.userId,
        role: user.role,
        status: user.status
      }
    });
  } catch (error: any) {
    console.error('Authentication API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server login validation error' }, { status: 500 });
  }
}
