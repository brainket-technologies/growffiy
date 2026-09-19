import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';

export const dynamic = 'force-dynamic';

function parseMessages(messageStr: string, replyStr?: string | null): any[] {
  try {
    const parsed = JSON.parse(messageStr);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  // Legacy: convert plain strings to array format
  const msgs: any[] = [];
  if (messageStr) {
    msgs.push({ sender: 'user', text: messageStr, timestamp: new Date().toISOString() });
  }
  if (replyStr) {
    msgs.push({ sender: 'admin', text: replyStr, timestamp: new Date().toISOString() });
  }
  return msgs;
}

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

    const chatMessages = JSON.stringify([
      { sender: 'user', text: message, timestamp: new Date().toISOString() }
    ]);

    const newTicket = await prisma.supportTicket.create({
      data: {
        userId: user.id,
        subject,
        message: chatMessages,
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

    const existingTicket = await prisma.supportTicket.findUnique({
      where: { id: ticketId }
    });

    if (!existingTicket) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    const updateData: any = {};

    if (status !== undefined) {
      updateData.status = status;
    }

    if (reply && reply.trim()) {
      // Parse existing messages (handle both legacy and new JSON format)
      const existingMessages = parseMessages(existingTicket.message, existingTicket.reply);
      // Append admin reply
      existingMessages.push({
        sender: 'admin',
        text: reply.trim(),
        timestamp: new Date().toISOString()
      });
      updateData.message = JSON.stringify(existingMessages);
      // Also store in legacy reply field for backward compatibility
      updateData.reply = reply.trim();
      if (!status) {
        updateData.status = 'resolved';
      }
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData
    });

    return NextResponse.json({ success: true, ticket: updatedTicket });
  } catch (error: any) {
    console.error('Support ticket update error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
