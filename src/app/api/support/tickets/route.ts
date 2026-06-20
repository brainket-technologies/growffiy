import { NextResponse } from 'next/server';
import { prisma } from '../../../../database/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const all = searchParams.get('all') === 'true';

    if (!userId && !all) {
      return NextResponse.json({ success: false, error: 'User ID is required or specify all=true' }, { status: 400 });
    }

    let tickets;
    if (all) {
      tickets = await prisma.supportTicket.findMany({
        include: {
          user: {
            select: {
              name: true,
              email: true,
              userId: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { id: userId! },
            { userId: userId! }
          ]
        }
      });

      if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }

      tickets = await prisma.supportTicket.findMany({
        where: { userId: user.id },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              userId: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

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

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { ticketId, reply, status } = body;

    if (!ticketId) {
      return NextResponse.json({ success: false, error: 'Ticket ID is required' }, { status: 400 });
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        reply: reply !== undefined ? reply : undefined,
        status: status !== undefined ? status : undefined
      }
    });

    return NextResponse.json({ success: true, ticket: updatedTicket });
  } catch (error: any) {
    console.error('Support ticket update error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

