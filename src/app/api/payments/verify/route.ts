import { NextResponse } from 'next/server';
import { prisma } from '../../../../database/db';
import crypto from 'crypto';
import { sendEmail } from '../../../../shared/services/mailer';

export async function POST(request: Request) {
  try {
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

    // 4. Update the Payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'success',
        razorpayPaymentId,
        paymentDate: new Date()
      }
    });

    // 5. Find the latest active subscription for this user to queue the next one if applicable
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

    // 8. Fetch user details to send invoice email
    const user = await prisma.user.findUnique({
      where: { id: payment.userId }
    });

    if (user && user.email) {
      const invoiceDate = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const formattedExpiry = endDate.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });

      const emailSubject = `Growffiy Invoice: Purchase Successful - ${payment.plan.name}`;

      const emailText = `Hello ${user.name},\n\nThank you for your purchase. Your subscription to ${payment.plan.name} is now active.\n\nInvoice Details:\n- Payment ID: ${razorpayPaymentId}\n- Order ID: ${razorpayOrderId}\n- Date: ${invoiceDate}\n- Amount: ₹${Number(payment.amount).toLocaleString('en-IN')}\n- Expiry Date: ${formattedExpiry}\n\nBest Regards,\nGrowffiy Operations Team`;

      const emailHtml = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 32px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px;">
            <div>
              <h2 style="color: #1E88FF; font-weight: 800; margin: 0; font-size: 26px; letter-spacing: -0.5px;">GROWFFIY</h2>
              <span style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Automated Trading Desk</span>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 12px; font-weight: 700; color: #059669; background-color: #d1fae5; padding: 6px 14px; border-radius: 99px; text-transform: uppercase;">Paid</span>
            </div>
          </div>
          
          <p style="font-size: 15px; line-height: 1.6; color: #334155;">Dear <strong>${user.name}</strong>,</p>
          <p style="font-size: 15px; line-height: 1.6; color: #334155;">
            Thank you for purchasing a subscription plan. Your automated execution terminals are now active. Below is the official invoice for your transaction.
          </p>
          
          <!-- Invoice Details Box -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h4 style="margin: 0 0 16px 0; color: #0f172a; font-size: 15px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Invoice Details</h4>
            <table style="width: 100%; font-size: 14px; border-collapse: collapse; line-height: 1.8;">
              <tr>
                <td style="color: #64748b; width: 150px;"><strong>Invoice Date:</strong></td>
                <td style="color: #0f172a;">${invoiceDate}</td>
              </tr>
              <tr>
                <td style="color: #64748b;"><strong>Razorpay Payment ID:</strong></td>
                <td style="color: #0f172a; font-family: monospace; font-size: 13px;">${razorpayPaymentId}</td>
              </tr>
              <tr>
                <td style="color: #64748b;"><strong>Razorpay Order ID:</strong></td>
                <td style="color: #0f172a; font-family: monospace; font-size: 13px;">${razorpayOrderId}</td>
              </tr>
              <tr>
                <td style="color: #64748b;"><strong>Payment Mode:</strong></td>
                <td style="color: #0f172a;">Razorpay Secure Gateway</td>
              </tr>
            </table>
          </div>

          <!-- Order Summary Table -->
          <table style="width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 14px;">
            <thead>
              <tr style="border-bottom: 2px solid #e2e8f0; color: #64748b; text-align: left;">
                <th style="padding: 12px 8px; font-weight: 700;">Description</th>
                <th style="padding: 12px 8px; font-weight: 700; text-align: right;">Duration</th>
                <th style="padding: 12px 8px; font-weight: 700; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #f1f5f9; color: #0f172a;">
                <td style="padding: 16px 8px; font-weight: 600;">
                  ${payment.plan.name} <br />
                  <span style="font-size: 11px; color: #64748b; font-weight: normal;">Automated breakout signals execution & risk guard</span>
                </td>
                <td style="padding: 16px 8px; text-align: right;">${payment.plan.durationDays} Days</td>
                <td style="padding: 16px 8px; text-align: right; font-weight: 600;">₹${Number(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr style="color: #0f172a; font-size: 16px; font-weight: 700;">
                <td colspan="2" style="padding: 20px 8px 8px 8px; text-align: right; color: #64748b;">Total Paid:</td>
                <td style="padding: 20px 8px 8px 8px; text-align: right; color: #1E88FF;">₹${Number(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>

          <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 16px; margin: 24px 0; font-size: 13px; color: #0369a1; line-height: 1.5;">
            <strong>✓ Subscription Active:</strong> Your plan starts immediately and is valid until <strong>${formattedExpiry}</strong>. All breakout trades will execute automatically on your Zerodha account.
          </div>

          <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin-top: 24px;">
            A copy of this invoice has been archived in your client account portal. For billing support, please raise a ticket from the Support page.
          </p>

          <div style="margin-top: 36px; border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 11px; color: #94a3b8;">
            © 2026 Growffiy Inc. All rights reserved. <br />
            Thank you for choosing Growffiy.
          </div>
        </div>
      `;

      await sendEmail({
        to: user.email,
        subject: emailSubject,
        text: emailText,
        html: emailHtml
      }).catch(err => console.error('Failed to send invoice email:', err));
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and subscription activated successfully',
      payment: updatedPayment,
      subscription
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
