import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'growffi-secret-key-fallback';

export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { capital, perDayTradeAmount } = body;

    // Validate
    if (capital !== undefined && (isNaN(Number(capital)) || Number(capital) < 0)) {
      return NextResponse.json({ success: false, error: 'Invalid capital amount' }, { status: 400 });
    }
    if (perDayTradeAmount !== undefined && (isNaN(Number(perDayTradeAmount)) || Number(perDayTradeAmount) < 0)) {
      return NextResponse.json({ success: false, error: 'Invalid per day trade amount' }, { status: 400 });
    }

    const updateData: any = {};
    if (capital !== undefined) updateData.capital = Number(capital);
    if (perDayTradeAmount !== undefined) updateData.perDayTradeAmount = Number(perDayTradeAmount);

    await prisma.client.update({
      where: { userId: decoded.id },
      data: updateData,
    });

    return NextResponse.json(
      { success: true, message: 'Trade settings updated successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update trade settings error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
