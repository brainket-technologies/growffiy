import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'growffi-secret-key-fallback';

function parseMessages(messageStr: string, fallbackText?: string): any[] {
  try {
    const parsed = JSON.parse(messageStr);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  // Legacy: convert plain string to array format
  const msgs: any[] = [];
  if (messageStr) {
    msgs.push({ sender: 'user', text: messageStr, timestamp: new Date().toISOString() });
  }
  if (fallbackText) {
    msgs.push({ sender: 'admin', text: fallbackText, timestamp: new Date().toISOString() });
  }
  return msgs;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Await params (required in Next.js 15)
    const { id: ticketId } = await params;

    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Missing or invalid token format' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    const userId = decoded.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: User ID missing in token' },
        { status: 401 }
      );
    }

    if (!ticketId) {
      return NextResponse.json(
        { success: false, error: 'Ticket ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Reply message is required' },
        { status: 400 }
      );
    }

    const existingTicket = await prisma.supportTicket.findFirst({
      where: { id: ticketId, userId }
    });

    if (!existingTicket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found or unauthorized' },
        { status: 404 }
      );
    }

    // Parse existing messages (handles both legacy plain text and new JSON format)
    const existingMessages = parseMessages(existingTicket.message, existingTicket.reply ?? undefined);

    // Append new user message
    existingMessages.push({
      sender: 'user',
      text: message,
      timestamp: new Date().toISOString()
    });

    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        message: JSON.stringify(existingMessages),
        status: 'open', // Reopen ticket when user replies
      },
      select: {
        id: true,
        subject: true,
        message: true,
        category: true,
        status: true,
        reply: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({ success: true, data: { ticket } });
  } catch (error: any) {
    console.error('Error replying to support ticket:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reply to ticket' },
      { status: 500 }
    );
  }
}
