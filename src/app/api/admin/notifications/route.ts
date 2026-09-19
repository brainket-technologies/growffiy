import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';

// POST /api/admin/notifications
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, message, userIds, broadcast } = body;

    if (!title || !message) {
      return NextResponse.json({ success: false, error: 'Title and message are required' }, { status: 400 });
    }

    if (broadcast) {
      // Get all users
      const allUsers = await prisma.user.findMany({ select: { id: true } });
      const notifications = allUsers.map(u => ({
        userId: u.id,
        title,
        body: message,
        type: 'info',
        isRead: false,
      }));

      await prisma.notification.createMany({
        data: notifications,
      });

      return NextResponse.json({ success: true, message: `Broadcasted to ${allUsers.length} users` });
    } else if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      const notifications = userIds.map(uid => ({
        userId: uid,
        title,
        body: message,
        type: 'info',
        isRead: false,
      }));

      await prisma.notification.createMany({
        data: notifications,
      });

      return NextResponse.json({ success: true, message: `Sent to ${userIds.length} users` });
    }

    return NextResponse.json({ success: false, error: 'Provide userIds array or broadcast=true' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// GET /api/admin/notifications
export async function GET(request: Request) {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { user: { select: { name: true, email: true } } }
    });
    return NextResponse.json({ success: true, data: notifications });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
