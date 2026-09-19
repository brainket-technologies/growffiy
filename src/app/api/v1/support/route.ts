import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'growffi-secret-key-fallback';

export async function GET(request: Request) {
  try {
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

    const tickets = await prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
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

    return NextResponse.json({ success: true, data: { tickets } });
  } catch (error: any) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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

    const body = await request.json();
    const { subject, category, message } = body;

    if (!subject || !category || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: subject, category, message' },
        { status: 400 }
      );
    }

    // Store first message as a JSON array of chat messages
    const chatMessages = JSON.stringify([
      { sender: 'user', text: message, timestamp: new Date().toISOString() }
    ]);

    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        subject,
        category,
        message: chatMessages,
        status: 'open',
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
    console.error('Error creating support ticket:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create ticket' },
      { status: 500 }
    );
  }
}
