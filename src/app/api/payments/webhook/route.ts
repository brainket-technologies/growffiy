import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ success: false, error: 'Missing signature' }, { status: 400 });
    }

    // 1. Get Razorpay webhook secret from Settings
    const dbSettings = await prisma.appSettings.findMany();
    const settings: Record<string, string> = {};
    dbSettings.forEach((s) => {
      settings[s.settingKey] = s.settingValue;
    });

    // In a real app you might have a dedicated webhook secret setting. 
    // If not, it's often the same as the key secret or configured separately in the dashboard.
    // Assuming we use a dedicated setting or fallback to secret.
    const mode = settings['razorpay_mode'] || 'test';
    const webhookSecret = settings['razorpay_webhook_secret'] || (mode === 'live' ? settings['razorpay_live_key_secret'] : settings['razorpay_test_key_secret']);

    if (!webhookSecret) {
      return NextResponse.json({ success: false, error: 'Webhook secret not configured' }, { status: 500 });
    }

    // 2. Validate the signature
    const generatedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (generatedSignature !== signature) {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);

    // 3. Handle specific events (e.g., payment.captured)
    if (payload.event === 'payment.captured' || payload.event === 'order.paid') {
      const paymentEntity = payload.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;

      // Find the pending Payment record
      const payment = await prisma.payment.findFirst({
        where: { razorpayOrderId: orderId },
        include: { plan: true }
      });

      if (payment && payment.status === 'pending') {
        // Update the Payment status
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'success',
            razorpayPaymentId: paymentId,
            paymentDate: new Date()
          }
        });

        // Create or Update Subscription
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

        await prisma.subscription.create({
          data: {
            userId: payment.userId,
            planId: payment.planId,
            startDate,
            endDate,
            status: 'active'
          }
        });

        // Activate subscription status in Client profile table
        await prisma.client.updateMany({
          where: { userId: payment.userId },
          data: {
            subscriptionStatus: 'active'
          }
        });
        console.log(`[Webhook] Successfully activated subscription for order ${orderId}`);
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
