import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import { getCachedData } from '../../../../shared/utils/redis';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const all = searchParams.get('all') === 'true';

    if (!userId && !all) {
      return NextResponse.json({ success: false, error: 'User ID is required or specify all=true' }, { status: 400 });
    }

    const cacheKey = all ? 'payments_history:all' : `payments_history:user:${userId}`;
    const ttl = all ? 30 : 15;

    let payments;
    if (all) {
      payments = await getCachedData(cacheKey, () => prisma.payment.findMany({
        include: {
          plan: true,
          user: { select: { name: true, email: true, userId: true } }
        },
        orderBy: { createdAt: 'desc' }
      }), ttl);
    } else {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { id: userId! },
            { userId: userId! },
            { email: userId! }
          ]
        }
      });

      if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }

      payments = await prisma.payment.findMany({
        where: { userId: user.id },
        include: {
          plan: true,
          user: {
            select: {
              name: true,
              email: true,
              userId: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    }

    return NextResponse.json({ success: true, payments });
  } catch (error: any) {
    console.error('Payment history fetch error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

