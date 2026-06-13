import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { userId: userId }
        ]
      }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const tickets = await prisma.supportTicket.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, tickets });
  } catch (error: any) {
    console.error('Support ticket fetch error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, subject, message, category } = body;

    if (!userId || !subject || !message) {
      return NextResponse.json({ success: false, error: 'User ID, subject, and message are required' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { userId: userId }
        ]
      }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const newTicket = await prisma.supportTicket.create({
      data: {
        userId: user.id,
        subject,
        message,
        category: category || 'General',
        status: 'open'
      }
    });

    return NextResponse.json({ success: true, ticket: newTicket });
  } catch (error: any) {
    console.error('Support ticket creation error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
