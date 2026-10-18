import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'growffi-secret-key-fallback';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    let authenticatedUserId: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        authenticatedUserId = decoded.id;
      } catch (err) {
        // Invalid token
      }
    }

    let planId: string | null = null;
    let utrNumber: string | null = null;
    let targetUserId: string | null = null;
    let screenshotUrl: string | null = null;

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      planId = (formData.get('planId') as string) || null;
      utrNumber = (formData.get('utrNumber') as string) || null;
      const formUserId = (formData.get('userId') as string) || null;
      targetUserId = authenticatedUserId || formUserId;

      const file = formData.get('screenshot') as File | null;
      if (file && typeof file === 'object' && 'arrayBuffer' in file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const ext = file.name ? path.extname(file.name) || '.jpg' : '.jpg';
        const fileName = `manual_pay_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'payments');
        
        await fs.promises.mkdir(uploadDir, { recursive: true });
        await fs.promises.writeFile(path.join(uploadDir, fileName), buffer);
        
        screenshotUrl = `/uploads/payments/${fileName}`;
      } else {
        const formScreenshotUrl = formData.get('screenshotUrl') as string | null;
        if (formScreenshotUrl) {
          screenshotUrl = formScreenshotUrl;
        }
      }
    } else {
      const body = await request.json();
      planId = body.planId;
      utrNumber = body.utrNumber;
      targetUserId = authenticatedUserId || body.userId;
      screenshotUrl = body.screenshotUrl || null;
    }

    if (!planId || !targetUserId || !utrNumber) {
      return NextResponse.json({ 
        success: false, 
        error: 'Plan ID, User ID, and UTR/Transaction Reference Number are required' 
      }, { status: 400 });
    }

    // 1. Fetch Plan details
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return NextResponse.json({ success: false, error: 'Subscription plan not found' }, { status: 404 });
    }

    // 2. Fetch User details
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: targetUserId },
          { userId: targetUserId },
          { email: targetUserId }
        ]
      }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // 3. Calculate GST if enabled
    const dbSettings = await prisma.appSettings.findMany();
    const settings: Record<string, string> = {};
    dbSettings.forEach((s) => {
      settings[s.settingKey] = s.settingValue;
    });

    const isGstEnabled = settings['gst_enabled'] === 'true';
    const gstPercentage = isGstEnabled ? parseFloat(settings['gst_percentage'] || '18') : 0;
    const basePrice = Number(plan.price);
    const gstAmount = isGstEnabled ? (basePrice * (gstPercentage / 100)) : 0;
    const totalAmount = basePrice + gstAmount;

    // 4. Save Payment record in Database
    const payment = await (prisma.payment as any).create({
      data: {
        userId: user.id,
        planId: plan.id,
        amount: totalAmount,
        razorpayOrderId: `MANUAL_UPI_${Date.now()}`,
        razorpayPaymentId: utrNumber.trim(),
        screenshotUrl: screenshotUrl || null,
        status: 'pending',
        paymentDate: new Date()
      }
    });

    // Update client subscriptionStatus to pending while waiting for admin approval
    try {
      await prisma.client.updateMany({
        where: { userId: user.id },
        data: { subscriptionStatus: 'pending' }
      });
    } catch (clientErr) {
      console.warn('Failed to update client subscription status to pending:', clientErr);
    }

    // 5. Create notification for user
    try {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Manual Payment Submitted',
          body: `Your payment of ₹${totalAmount.toFixed(0)} for ${plan.name} (UTR: ${utrNumber}) has been submitted and is pending verification.`,
          type: 'payment'
        }
      });
    } catch (notifErr) {
      console.warn('Failed to send notification for manual payment:', notifErr);
    }

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      amount: totalAmount,
      message: 'Your payment details have been submitted for verification.'
    });
  } catch (error: any) {
    console.error('Manual payment submission error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
