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

    // Fetch the client to get their assigned productTypeId
    const client = await prisma.client.findUnique({
      where: { userId: decoded.id }
    });

    const whereClause: any = { status: 'active' };
    
    // STRICT: Only return plans matching the client's assigned product type
    if (client?.productTypeId) {
      whereClause.productTypeId = client.productTypeId;
    } else {
      // If no product type is assigned to the client, do not leak or mix all product plans
      whereClause.productTypeId = '__NONE__';
    }

    const plans = await prisma.subscriptionPlan.findMany({
      where: whereClause,
      orderBy: { price: 'asc' }
    });

    const dbSettings = await prisma.appSettings.findMany();
    const settings: Record<string, string> = {};
    dbSettings.forEach((s) => {
      settings[s.settingKey] = s.settingValue;
    });

    const gstEnabled = (settings['gst_enabled'] || 'true') === 'true';
    const gstPercentage = Number(settings['gst_percentage'] || '18');

    // Fetch user's pending manual payment if any
    const pendingPayment = await prisma.payment.findFirst({
      where: {
        userId: decoded.id,
        status: 'pending'
      },
      include: {
        plan: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Subscription plans fetched successfully',
        data: {
          plans,
          gstEnabled,
          gstPercentage,
          paymentMethod: settings['payment_method'] || 'online',
          manualUpiId: settings['manual_upi_id'] || '',
          manualUpiName: settings['manual_upi_name'] || '',
          manualQrCode: settings['manual_qr_code'] || '',
          manualPaymentNote: settings['manual_payment_note'] || '',
          pendingPayment: pendingPayment ? {
            id: pendingPayment.id,
            planId: pendingPayment.planId,
            planName: pendingPayment.plan?.name || 'Subscription Plan',
            amount: Number(pendingPayment.amount),
            utrNumber: pendingPayment.razorpayPaymentId || '',
            screenshotUrl: pendingPayment.screenshotUrl || null,
            createdAt: pendingPayment.createdAt
          } : null
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
