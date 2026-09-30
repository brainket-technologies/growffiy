import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'growffi-secret-key-fallback';

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
    
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    if (!payload || (!payload.userId && !payload.id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid token payload' },
        { status: 401 }
      );
    }

    const userId = payload.id || payload.userId;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.isDeleted) {
      return NextResponse.json(
        { success: false, error: 'Account already deleted' },
        { status: 400 }
      );
    }

    // Set isDeleted to true instead of actually deleting from db to preserve relational data
    await prisma.user.update({
      where: { id: userId },
      data: { isDeleted: true }
    });

    // We can also invalidate devices or sessions
    await prisma.userDevice.deleteMany({
      where: { userId: userId }
    });

    return NextResponse.json({
      success: true,
      message: 'Account successfully marked as deleted'
    });
  } catch (error: any) {
    console.error('Delete Account Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request: ' + error.message },
      { status: 500 }
    );
  }
}
