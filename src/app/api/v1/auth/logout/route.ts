import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/database/db';

const JWT_SECRET = process.env.JWT_SECRET || 'growffi-secret-key-fallback';
const EXPECTED_API_KEY = process.env.MOBILE_API_KEY || '';

export async function POST(request: Request) {
  try {
    // 1. Validate device headers
    const headers = request.headers;
    const apiKey = headers.get('x-api-key');

    if (!apiKey || apiKey !== EXPECTED_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Invalid API Key' },
        { status: 401 }
      );
    }

    // 2. Extract Bearer token
    const authHeader = headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid Authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];

    // 3. Verify JWT
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const userId: string = decoded.id;

    // 4. Optional: Clear FCM token from DB so no notifications are sent after logout
    const fcmToken = headers.get('x-fcm-token');
    if (fcmToken && userId) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { fcmToken: null },
        });
      } catch (_) {
        // Non-fatal: user might not have fcmToken field — ignore silently
      }
    }

    // 5. Return success — client is responsible for clearing local storage
    return NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Logout API Error]', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
