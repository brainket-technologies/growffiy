import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import { verifySessionToken } from '@/shared/utils/session';

export async function POST(request: Request) {
  try {
    const { userId, role, token } = await request.json();

    if (!userId || !token) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: 'Missing user credentials or session token'
      }, { status: 401 });
    }

    // 1. Staff Verification
    if (role === 'staff') {
      let staff = null;
      try {
        staff = await prisma.staff.findFirst({
          where: {
            OR: [
              { id: userId },
              { userId: userId },
              { email: userId }
            ]
          }
        });
      } catch (err) {
        console.warn('Prisma staff lookup error in session verification:', err);
      }

      if (!staff) {
        try {
          const { inMemoryStaff } = require('@/shared/store/inMemoryStaff');
          staff = inMemoryStaff.find((s: any) =>
            s.id === userId ||
            s.userId?.toLowerCase() === userId.toLowerCase() ||
            s.email?.toLowerCase() === userId.toLowerCase()
          );
        } catch {
          // ignore
        }
      }

      if (!staff || staff.status !== 'active') {
        return NextResponse.json({ success: false, valid: false, error: 'Staff account inactive or not found' }, { status: 401 });
      }

      const isValid = verifySessionToken(token, staff.password);
      if (!isValid) {
        return NextResponse.json({ success: false, valid: false, error: 'Session invalidated due to password change' }, { status: 401 });
      }

      return NextResponse.json({ success: true, valid: true });
    }

    // 2. Admin & Client Verification
    let user = null;
    try {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { id: userId },
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
      console.warn('Prisma user lookup error in session verification:', e);
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
        if (match) {
          user = {
            id: match.id,
            password: '123',
            status: 'active',
            role: 'client'
          };
        }
      } catch (err) {
        console.warn('InMemory user lookup fallback error in session verification:', err);
      }
    }

    if (!user || user.status === 'blocked' || (user as any).isBlocked || (user as any).isDeleted) {
      return NextResponse.json({ success: false, valid: false, error: 'User account inactive or not found' }, { status: 401 });
    }

    if (role && user.role !== role) {
      return NextResponse.json({ success: false, valid: false, error: 'Role mismatch' }, { status: 403 });
    }

    const isValid = verifySessionToken(token, user.password);
    if (!isValid) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: 'Session invalidated due to password change. Please log in again.'
      }, { status: 401 });
    }

    return NextResponse.json({ success: true, valid: true });
  } catch (error: any) {
    console.error('Session verification API error:', error);
    return NextResponse.json({ success: false, valid: false, error: 'Server error verifying session' }, { status: 500 });
  }
}
