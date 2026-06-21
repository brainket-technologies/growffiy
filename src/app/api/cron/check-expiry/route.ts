import { NextResponse } from 'next/server';
import { prisma } from '../../../../database/db';
import { sendEmail } from '../../../../shared/services/mailer';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Basic authorization header check to protect the cron endpoint (optional, can be triggered by serverless crons)
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const cronSecret = process.env.CRON_SECRET || 'growffiy_cron_secret';

    if (secret !== cronSecret) {
      return NextResponse.json({ success: false, error: 'Unauthorized cron execution' }, { status: 401 });
    }

    const now = new Date();

    // 1. SCAN AND EXPIRE SUBSCRIPTIONS THAT HAVE PASSED END DATE
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        endDate: {
          lt: now
        }
      }
    });

    const expiredUsers = new Set<string>();
    for (const sub of expiredSubscriptions) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'expired' }
      });
      expiredUsers.add(sub.userId);
    }

    // Update Client subscriptionStatus to expired if they don't have any other active plan currently running
    for (const userId of expiredUsers) {
      const currentActiveSub = await prisma.subscription.findFirst({
        where: {
          userId,
          status: 'active',
          startDate: {
            lte: now
          },
          endDate: {
            gte: now
          }
        }
      });

      if (!currentActiveSub) {
        await prisma.client.updateMany({
          where: { userId },
          data: {
            subscriptionStatus: 'expired',
            tradingStatus: 'inactive'
          }
        });
      }
    }

    // 2. SCAN FOR SUBSCRIPTIONS EXPIRING IN 7 DAYS (Alert daily starting 7 days before expiry)
    const targetDateMin = new Date();
    targetDateMin.setHours(0, 0, 0, 0);

    const targetDateMax = new Date();
    targetDateMax.setDate(now.getDate() + 7);
    targetDateMax.setHours(23, 59, 59, 999);

    // Fetch active subscriptions expiring in the next 7 days
    const expiringSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        endDate: {
          gte: targetDateMin,
          lte: targetDateMax
        }
      },
      include: {
        user: true,
        plan: true
      }
    });

    const results = [];

    for (const sub of expiringSubscriptions) {
      if (!sub.user.email) continue;

      // Check if user has a queued subscription that starts after this one expires
      const hasQueued = await prisma.subscription.findFirst({
        where: {
          userId: sub.userId,
          status: 'active',
          startDate: {
            gte: sub.endDate
          }
        }
      });
      if (hasQueued) {
        continue;
      }

      const formattedExpiry = new Date(sub.endDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });

      const end = new Date(sub.endDate);
      const today = new Date();
      end.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const diffTime = end.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const emailSubject = `Alert: Your Growffiy Subscription expires in ${daysLeft} days`;
      
      const emailText = `Hello ${sub.user.name},\n\nYour Growffiy automated trading subscription (${sub.plan.name}) is expiring in ${daysLeft} days on ${formattedExpiry}.\n\nTo prevent any disruption to your automated momentum breakout execution, please renew your subscription package by visiting your billing dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/clients/subscription.\n\nBest Regards,\nGrowffiy Operations Team`;

      const emailHtml = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 32px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h2 style="color: #1E88FF; font-weight: 800; margin: 0; font-size: 26px; letter-spacing: -0.5px;">GROWFFIY</h2>
            <span style="font-size: 11px; font-weight: 700; color: #f59e0b; background-color: #fef3c7; padding: 6px 14px; border-radius: 99px; text-transform: uppercase; margin-top: 10px; display: inline-block; letter-spacing: 0.5px;">Subscription Renewal Notice</span>
          </div>
          
          <p style="font-size: 15px; line-height: 1.6; color: #334155;">Hello <strong>${sub.user.name}</strong>,</p>
          
          <p style="font-size: 15px; line-height: 1.6; color: #334155;">
            This is a friendly reminder that your active automated trading plan is expiring in <strong>${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}</strong>.
          </p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h4 style="margin: 0 0 16px 0; color: #0f172a; font-size: 15px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 8px;">Plan Expiry Details:</h4>
            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; width: 140px;"><strong>Subscription Plan:</strong></td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${sub.plan.name}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;"><strong>Expiration Date:</strong></td>
                <td style="padding: 6px 0; color: #991b1b; font-weight: 600;">${formattedExpiry}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;"><strong>Pricing:</strong></td>
                <td style="padding: 6px 0; color: #0f172a;">₹${Number(sub.plan.price).toLocaleString('en-IN')}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 12px; padding: 16px; margin: 24px 0; font-size: 13px; color: #991b1b; line-height: 1.5;">
            <strong>⚠️ Execution Break Warning:</strong> If not renewed, your API connection will be disconnected on the expiration date, and all automated strategy signals will stop executing on your account.
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/clients/subscription" 
               style="background-color: #1E88FF; color: white; padding: 14px 28px; font-weight: 700; font-size: 15px; border-radius: 12px; text-decoration: none; display: inline-block; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.25);">
              Renew Plan Now
            </a>
          </div>

          <p style="font-size: 14px; color: #64748b; line-height: 1.6;">
            If you have any questions or require custom corporate plans, please do not hesitate to contact our desk by raising a support ticket from your portal.
          </p>

          <div style="margin-top: 36px; border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
            © 2026 Growffiy Inc. All rights reserved. <br />
            This is an automated operational notice regarding your active subscription.
          </div>
        </div>
      `;

      const mailRes = await sendEmail({
        to: sub.user.email,
        subject: emailSubject,
        text: emailText,
        html: emailHtml
      });

      results.push({
        userId: sub.user.id,
        email: sub.user.email,
        sent: mailRes.success,
        messageId: mailRes.messageId || null,
        error: mailRes.error || null
      });
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      details: results
    });

  } catch (error: any) {
    console.error('Subscription expiry cron error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
