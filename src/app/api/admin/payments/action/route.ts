import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import { invalidateCache } from '../../../../../shared/utils/redis';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paymentId, action, rejectReason } = body;

    if (!paymentId || !['approve', 'reject', 'delete'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Valid paymentId and action (approve/reject/delete) are required' },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { plan: true, user: true }
    });

    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
    }

    if (action === 'delete') {
      if (payment.screenshotUrl) {
        try {
          const filePath = path.join(process.cwd(), 'public', payment.screenshotUrl);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (e) {
          console.warn('Failed to delete screenshot file:', e);
        }
      }
      await prisma.payment.delete({
        where: { id: paymentId }
      });

      // Re-sync client subscription status
      const activeSub = await prisma.subscription.findFirst({
        where: { userId: payment.userId, status: 'active', endDate: { gt: new Date() } }
      });
      if (!activeSub) {
        const remainingPending = await prisma.payment.findFirst({
          where: { userId: payment.userId, status: 'pending' }
        });
        await prisma.client.updateMany({
          where: { userId: payment.userId },
          data: { subscriptionStatus: remainingPending ? 'pending' : 'inactive' }
        });
      }

      try {
        await invalidateCache('payments_history:*');
      } catch (cacheErr) {
        console.warn('Failed to invalidate payments cache:', cacheErr);
      }

      return NextResponse.json({
        success: true,
        message: 'Payment record deleted successfully.'
      });
    }

    if (payment.status === 'success' || payment.status === 'captured') {
      return NextResponse.json({ success: false, error: 'Payment has already been approved' }, { status: 400 });
    }

    if (action === 'approve') {
      // 1. Mark payment as success
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'success',
          paymentDate: new Date()
        }
      });

      // 2. Activate Subscription
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
      const durationDays = payment.plan?.durationDays || 30;
      const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

      await prisma.subscription.create({
        data: {
          userId: payment.userId,
          planId: payment.planId,
          startDate,
          endDate,
          status: 'active'
        }
      });

      // 3. Update client subscription status
      await prisma.client.updateMany({
        where: { userId: payment.userId },
        data: { subscriptionStatus: 'active' }
      });

      // 4. Notify user
      try {
        await prisma.notification.create({
          data: {
            userId: payment.userId,
            title: 'Subscription Activated! 🎉',
            body: `Your payment for ${payment.plan?.name || 'Subscription Plan'} has been approved by admin. Valid until ${endDate.toLocaleDateString('en-GB')}.`,
            type: 'subscription'
          }
        });
      } catch (notifErr) {
        console.warn('Notification failed:', notifErr);
      }

      try {
        await invalidateCache('payments_history:*');
      } catch (cacheErr) {
        console.warn('Failed to invalidate payments cache:', cacheErr);
      }

      return NextResponse.json({
        success: true,
        message: 'Payment approved and subscription activated successfully!'
      });
    } else {
      // Reject
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'failed'
        }
      });

      // Update client subscriptionStatus to inactive if they don't have an active subscription
      const activeSub = await prisma.subscription.findFirst({
        where: {
          userId: payment.userId,
          status: 'active',
          endDate: { gt: new Date() }
        }
      });
      if (!activeSub) {
        await prisma.client.updateMany({
          where: { userId: payment.userId },
          data: { subscriptionStatus: 'inactive' }
        });
      }

      // Notify user
      try {
        await prisma.notification.create({
          data: {
            userId: payment.userId,
            title: 'Payment Verification Rejected',
            body: `Your manual payment submission (UTR: ${payment.razorpayPaymentId}) was rejected${rejectReason ? ': ' + rejectReason : '.'}`,
            type: 'payment'
          }
        });
      } catch (notifErr) {
        console.warn('Notification failed:', notifErr);
      }

      try {
        await invalidateCache('payments_history:*');
      } catch (cacheErr) {
        console.warn('Failed to invalidate payments cache:', cacheErr);
      }

      return NextResponse.json({
        success: true,
        message: 'Payment has been rejected.'
      });
    }
  } catch (error: any) {
    console.error('Payment action error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
