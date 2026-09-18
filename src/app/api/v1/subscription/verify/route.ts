import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import crypto from 'crypto';
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
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ success: false, error: 'All payment parameters are required for verification' }, { status: 400 });
    }

    // 1. Get Razorpay key secret from Settings to verify signature
    const dbSettings = await prisma.appSettings.findMany();
    const settings: Record<string, string> = {};
    dbSettings.forEach((s) => {
      settings[s.settingKey] = s.settingValue;
    });

    const mode = settings['razorpay_mode'] || 'test';
    const keySecret = mode === 'live' ? settings['razorpay_live_key_secret'] : settings['razorpay_test_key_secret'];

    if (!keySecret) {
      return NextResponse.json({ success: false, error: 'Razorpay keys not configured in settings' }, { status: 500 });
    }

    // 2. Validate the signature
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    const isSignatureValid = generatedSignature === razorpaySignature;

    if (!isSignatureValid) {
      // Update payment to failed
      await prisma.payment.updateMany({
        where: { razorpayOrderId },
        data: { status: 'failed' }
      });
      return NextResponse.json({ success: false, error: 'Payment signature verification failed' }, { status: 400 });
    }

    // 3. Find the pending Payment record
    const payment = await prisma.payment.findFirst({
      where: { razorpayOrderId },
      include: { plan: true }
    });

    if (!payment) {
      return NextResponse.json({ success: false, error: 'Pending payment record not found' }, { status: 404 });
    }

    // Check if it belongs to this user
    if (payment.userId !== decoded.id) {
      return NextResponse.json({ success: false, error: 'Payment does not belong to this user' }, { status: 403 });
    }

    // Check if already verified
    if (payment.status === 'success') {
       return NextResponse.json({
         success: true,
         message: 'Payment already verified',
         data: { paymentId: payment.id }
       });
    }

    // 4. Update the Payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'success',
        razorpayPaymentId,
        paymentDate: new Date()
      }
    });

    // 5. Create or Update Subscription
    const latestSubscription = await prisma.subscription.findFirst({
      where: {
        userId: payment.userId,
        status: 'active'
      },
      orderBy: {
        endDate: 'desc'
      }
    });

    let startDate = new Date();
    if (latestSubscription && latestSubscription.endDate > startDate) {
      startDate = new Date(latestSubscription.endDate);
    }
    const endDate = new Date(startDate.getTime() + payment.plan.durationDays * 24 * 60 * 60 * 1000);

    const subscription = await prisma.subscription.create({
      data: {
        userId: payment.userId,
        planId: payment.planId,
        startDate,
        endDate,
        status: 'active'
      }
    });

    // 7. Activate subscription status in Client profile table
    await prisma.client.updateMany({
      where: { userId: payment.userId },
      data: {
        subscriptionStatus: 'active'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified and subscription activated successfully',
      data: {
        subscriptionId: subscription.id,
        endDate: subscription.endDate
      }
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
