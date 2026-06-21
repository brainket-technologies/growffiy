import { NextResponse } from 'next/server';
import { prisma } from '../../../../database/db';

export async function POST(request: Request) {
  try {
    const { userId, password, role } = await request.json();

    if (!userId || !password) {
      return NextResponse.json({ success: false, error: 'User ID and password are required' }, { status: 400 });
    }

    let user = null;
    try {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { userId: userId },
            { email: userId },
            {
              client: {
                zerodhaClientId: userId
              }
            }
          ]
        }
      });
    } catch (e) {
      console.warn('Prisma user lookup failed during auth login:', e);
    }

    if (!user) {
      try {
        const inMemory = require('../../clients/route').inMemoryClients;
        const match = inMemory.find((c: any) => 
          c.user?.userId?.toLowerCase() === userId.toLowerCase() ||
          c.user?.email?.toLowerCase() === userId.toLowerCase() ||
          c.zerodhaClientId?.toLowerCase() === userId.toLowerCase() ||
          c.id?.toLowerCase() === userId.toLowerCase()
        );
        if (match && password === '123') {
          user = {
            id: match.id,
            name: match.user.name,
            email: match.user.email,
            userId: match.user.userId,
            role: 'client',
            status: 'active',
            password: '123'
          };
        }
      } catch (err) {
        console.warn('InMemory client lookup fallback failed:', err);
      }
    }

    if (!user || user.password !== password) {
      return NextResponse.json({ success: false, error: 'Invalid User ID/Email/Zerodha ID or Password' }, { status: 401 });
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
