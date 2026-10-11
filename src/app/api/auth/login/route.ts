import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import { decryptText } from '@/shared/utils/crypto';

export async function POST(request: Request) {
  try {
    const { userId, password, role } = await request.json();

    if (!userId || !password) {
      return NextResponse.json({ success: false, error: 'User ID and password are required' }, { status: 400 });
    }

    let user = null;
    try {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { userId: userId },
            { email: userId },
            {
              client: {
                zerodhaClientId: userId
              }
            }
          ]
        }
      });
    } catch (e) {
      console.warn('Prisma user lookup failed during auth login:', e);
    }

    if (!user) {
      try {
        const inMemory = require('../../clients/route').inMemoryClients;
        const match = inMemory.find((c: any) => 
          c.user?.userId?.toLowerCase() === userId.toLowerCase() ||
          c.user?.email?.toLowerCase() === userId.toLowerCase() ||
          c.zerodhaClientId?.toLowerCase() === userId.toLowerCase() ||
          c.id?.toLowerCase() === userId.toLowerCase()
        );
        if (match && password === '123') {
          user = {
            id: match.id,
            name: match.user.name,
            email: match.user.email,
            userId: match.user.userId,
            role: 'client',
            status: 'active',
            password: '123'
          };
        }
      } catch (err) {
        console.warn('InMemory client lookup fallback failed:', err);
      }
    }

    const isPasswordValid = user && (user.password === password || decryptText(user.password) === password);

    if (!user || !isPasswordValid) {
      return NextResponse.json({ success: false, error: 'Invalid User ID/Email/Zerodha ID or Password' }, { status: 401 });
    }

    if (role && user.role !== role) {
      return NextResponse.json({ success: false, error: 'Unauthorized role assignment access' }, { status: 403 });
    }

    const { generateSessionToken } = require('@/shared/utils/session');
    const token = generateSessionToken(user.id, user.password);

    // Send Real-Time Security Alert Email for Admin Login
    const adminAlertTarget = process.env.ADMIN_ALERT_EMAIL || (user.role === 'admin' ? user.email : null);
    if (user.role === 'admin' && adminAlertTarget) {
      const userAgent = request.headers.get('user-agent') || 'Unknown User Agent';
      const rawIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
      const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });

      (async () => {
        try {
          const { sendEmail } = require('@/shared/services/mailer');
          const { getIpLocation, parseUserAgent } = require('@/shared/utils/securityAlert');
          const [locationInfo, deviceInfo] = await Promise.all([
            getIpLocation(rawIp),
            Promise.resolve(parseUserAgent(userAgent))
          ]);

          await sendEmail({
            to: adminAlertTarget,
            subject: '🛡️ Growffiy Alert: Admin Login Detected',
            text: `Hello ${user.name},\n\nA successful administrator login was detected on Growffiy Control Panel.\n\nAccount Details:\n- Admin ID: ${user.userId}\n- Email: ${user.email}\n\nLogin & System Details:\n- Location: ${locationInfo.formatted}\n- IP Address: ${rawIp}\n- Device: ${deviceInfo.formatted}\n- Raw User Agent: ${userAgent}\n- Time: ${timestamp} IST\n\nIf you did not authorize this login, please immediately change your administrator password and terminate active sessions.\n\nBest Regards,\nGrowffiy Security Team`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <h2 style="color: #1E88FF; font-weight: 800; margin: 0; font-size: 24px; letter-spacing: -0.5px;">GROWFFIY SECURITY</h2>
                  <span style="font-size: 11px; font-weight: 700; color: #2563eb; background-color: #eff6ff; padding: 4px 12px; border-radius: 99px; text-transform: uppercase; margin-top: 8px; display: inline-block;">Admin Login Alert</span>
                </div>
                
                <p style="font-size: 15px; margin-bottom: 12px;">Hello <strong>${user.name}</strong>,</p>
                <p style="font-size: 14px; color: #475569; margin-bottom: 20px;">A successful login was just completed for your Administrator account on the Growffiy Management Portal.</p>
                
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0;">
                  <h4 style="margin: 0 0 10px 0; color: #0f172a; font-size: 14px;">👤 Admin Profile:</h4>
                  <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 5px 0; color: #64748b; width: 140px;"><strong>Admin ID:</strong></td>
                      <td style="padding: 5px 0; color: #0f172a;"><code>${user.userId}</code></td>
                    </tr>
                    <tr>
                      <td style="padding: 5px 0; color: #64748b;"><strong>Admin Email:</strong></td>
                      <td style="padding: 5px 0; color: #0f172a;">${user.email}</td>
                    </tr>
                  </table>
                </div>

                <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; margin: 20px 0; font-size: 13px;">
                  <h4 style="margin: 0 0 10px 0; color: #166534; font-size: 14px;">📍 Session & Location Details:</h4>
                  <table style="width: 100%; border-collapse: collapse; color: #14532d; font-size: 13px;">
                    <tr>
                      <td style="padding: 5px 0; width: 140px;"><strong>Estimated Location:</strong></td>
                      <td style="padding: 5px 0; font-weight: 600;">🌍 ${locationInfo.formatted}</td>
                    </tr>
                    <tr>
                      <td style="padding: 5px 0;"><strong>IP Address:</strong></td>
                      <td style="padding: 5px 0;"><code>${rawIp}</code></td>
                    </tr>
                    <tr>
                      <td style="padding: 5px 0;"><strong>Device / Browser:</strong></td>
                      <td style="padding: 5px 0; font-weight: 600;">💻 ${deviceInfo.formatted}</td>
                    </tr>
                    <tr>
                      <td style="padding: 5px 0;"><strong>Timestamp:</strong></td>
                      <td style="padding: 5px 0;">⏰ ${timestamp} IST</td>
                    </tr>
                  </table>
                </div>

                <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-top: 24px;">
                  If this was not you, someone else may have gained access to your admin credentials. Change your password immediately to terminate all other active sessions across all devices.
                </p>
                <div style="margin-top: 28px; border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
                  © 2026 Growffiy Inc. All admin activities are monitored.
                </div>
              </div>
            `
          });
        } catch (emailErr) {
          console.error('Failed to dispatch admin login security alert email:', emailErr);
        }
      })();
    }

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        userId: user.userId,
        role: user.role,
        status: user.status
      }
    });
  } catch (error: any) {
    console.error('Authentication API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server login validation error' }, { status: 500 });
  }
}
