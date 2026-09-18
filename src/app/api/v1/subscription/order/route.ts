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
    const { planId } = body;

    if (!planId) {
      return NextResponse.json({ success: false, error: 'Plan ID is required' }, { status: 400 });
    }

    const userId = decoded.id; // From JWT

    // 1. Fetch Plan details
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return NextResponse.json({ success: false, error: 'Subscription plan not found' }, { status: 404 });
    }

    // 2. Get Razorpay credentials from Settings
    const dbSettings = await prisma.appSettings.findMany();
    const settings: Record<string, string> = {};
    dbSettings.forEach((s) => {
      settings[s.settingKey] = s.settingValue;
    });

    const mode = settings['razorpay_mode'] || 'test';
    const keyId = mode === 'live' ? settings['razorpay_live_key_id'] : settings['razorpay_test_key_id'];
    const keySecret = mode === 'live' ? settings['razorpay_live_key_secret'] : settings['razorpay_test_key_secret'];

    if (!keyId || !keySecret) {
      return NextResponse.json({ success: false, error: 'Razorpay keys not configured in settings' }, { status: 500 });
    }

    // 3. Create Razorpay order via direct fetch to API
    const amountInPaise = Math.round(Number(plan.price) * 100);
    const authString = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_plan_${plan.id.slice(0, 8)}_${Date.now()}`
      })
    });

    const razorpayOrder = await response.json();

    if (!response.ok || !razorpayOrder.id) {
      console.error('Razorpay Order API failed:', razorpayOrder);
      return NextResponse.json({ success: false, error: razorpayOrder.error?.description || 'Failed to create Razorpay order' }, { status: 500 });
    }

    // 4. Save pending Payment record in Database
    const payment = await prisma.payment.create({
      data: {
        userId: userId,
        planId: plan.id,
        amount: plan.price,
        razorpayOrderId: razorpayOrder.id,
        status: 'pending'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: razorpayOrder.id,
        amount: amountInPaise,
        currency: 'INR',
        paymentId: payment.id,
        razorpayKeyId: keyId // Need to send Key ID to frontend so it can initialize Razorpay UI
      }
    });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
