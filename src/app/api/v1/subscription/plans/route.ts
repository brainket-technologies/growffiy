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
    
    try {
      jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    const plans = await prisma.subscriptionPlan.findMany({
      where: { status: 'active' },
      orderBy: { price: 'asc' }
    });

    const dbSettings = await prisma.appSettings.findMany();
    const settings: Record<string, string> = {};
    dbSettings.forEach((s) => {
      settings[s.settingKey] = s.settingValue;
    });

    const gstEnabled = (settings['gst_enabled'] || 'true') === 'true';
    const gstPercentage = Number(settings['gst_percentage'] || '18');

    return NextResponse.json(
      {
        success: true,
        message: 'Subscription plans fetched successfully',
        data: {
          plans,
          gstEnabled,
          gstPercentage,
        }
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Fetch plans error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
