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

    const gstSetting = await prisma.appSettings.findUnique({
      where: { settingKey: 'gst_percentage' },
    });
    const gstRate = (gstSetting ? parseFloat(gstSetting.settingValue) : 18) / 100;

    const payments = await prisma.payment.findMany({
      where: {
        userId: userId,
      },
      include: {
        plan: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedPayments = payments.map(payment => {
      const baseAmount = payment.amount / (1 + gstRate);
      const gstAmount = payment.amount - baseAmount;
      return {
        ...payment,
        baseAmount,
        gstAmount,
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Payment history fetched successfully',
      data: {
        payments: formattedPayments,
      },
    });
  } catch (error: any) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
