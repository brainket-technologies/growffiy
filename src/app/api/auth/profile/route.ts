import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { sendEmail } from '../../../../lib/mailer';

export async function POST(request: Request) {
  try {
    const { userId, name, email, currentPassword, newPassword } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User identifier is required' }, { status: 400 });
    }

    // Find the user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { userId: userId },
          { email: userId }
        ]
      }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Case 1: Password change
    if (currentPassword && newPassword) {
      if (user.password !== currentPassword) {
        return NextResponse.json({ success: false, error: 'Incorrect current password' }, { status: 400 });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { password: newPassword }
      });

      // Send Email Notification for Admin role
      if (user.role === 'admin' && process.env.ADMIN_ALERT_EMAIL) {
        const userAgent = request.headers.get('user-agent') || 'Unknown User Agent';
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
        const host = request.headers.get('host') || 'localhost:3000';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const loginUrl = `${protocol}://${host}/admin/login`;
        const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });

        try {
          await sendEmail({
            to: process.env.ADMIN_ALERT_EMAIL,
            subject: 'Growffiy Alert: Admin Password Changed Successfully',
            text: `Hello ${user.name},\n\nYour administrator password has been updated.\n\nCredentials Details:\n- Admin ID: ${user.userId}\n- New Password: ${newPassword}\n- Control Panel URL: ${loginUrl}\n\nSystem Details:\n- IP Address: ${ip}\n- Device: ${userAgent}\n- Time: ${timestamp}\n\nIf you did not authorize this change, please check security logs immediately.\n\nBest Regards,\nGrowffiy Security Team`,
            html: `
              <div style="font-family: sans-serif; padding: 24px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <h2 style="color: #0ea5e9; font-weight: 800; margin: 0; font-size: 24px; letter-spacing: -0.5px;">GROWFFIY SECURITY</h2>
                  <span style="font-size: 10px; font-weight: 700; color: #ef4444; background-color: #fef2f2; padding: 4px 12px; border-radius: 99px; text-transform: uppercase; margin-top: 8px; display: inline-block;">Critical Security Notice</span>
                </div>
                
                <p>Hello <strong>${user.name}</strong>,</p>
                <p>The password for your Growffiy Administrator account has been updated successfully.</p>
                
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
                  <h4 style="margin: 0 0 12px 0; color: #0f172a; font-size: 14px;">Updated Credentials Details:</h4>
                  <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 6px 0; color: #64748b; width: 120px;"><strong>Admin ID:</strong></td>
                      <td style="padding: 6px 0; color: #0f172a;"><code>${user.userId}</code></td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #64748b;"><strong>New Password:</strong></td>
                      <td style="padding: 6px 0; color: #0f172a;"><code>${newPassword}</code></td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #64748b;"><strong>Login URL:</strong></td>
                      <td style="padding: 6px 0;"><a href="${loginUrl}" style="color: #0ea5e9; text-decoration: underline; font-weight: 600;">${loginUrl}</a></td>
                    </tr>
                  </table>
                </div>

                <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 12px;">
                  <h4 style="margin: 0 0 8px 0; color: #991b1b; font-size: 13px;">💻 System & Session Details:</h4>
                  <table style="width: 100%; border-collapse: collapse; color: #7f1d1d;">
                    <tr>
                      <td style="padding: 4px 0; width: 120px;"><strong>IP Address:</strong></td>
                      <td style="padding: 4px 0;"><code>${ip}</code></td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0;"><strong>Browser/Device:</strong></td>
                      <td style="padding: 4px 0; word-break: break-all;"><code>${userAgent}</code></td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0;"><strong>Timestamp:</strong></td>
                      <td style="padding: 4px 0;"><code>${timestamp}</code></td>
                    </tr>
                  </table>
                </div>

                <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-top: 24px;">
                  If you did not initiate this password change, please contact system security support immediately and lock your account.
                </p>
                <div style="margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
                  © 2026 Growffiy Inc. All admin activities are monitored.
                </div>
              </div>
            `
          });
        } catch (mailErr) {
          console.error('Failed to send admin security notification email:', mailErr);
        }
      }

      // Send Email Notification for Client role (when changing their own password)
      if (user.role === 'client' && user.email) {
        const userAgent = request.headers.get('user-agent') || 'Unknown User Agent';
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
        const host = request.headers.get('host') || 'localhost:3000';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const loginUrl = `${protocol}://${host}/login`;
        const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });

        try {
          await sendEmail({
            to: user.email,
            subject: 'Growffiy Alert: Password Changed Successfully',
            text: `Hello ${user.name},\n\nYour account password has been updated.\n\nCredentials Details:\n- User ID: ${user.userId}\n- New Password: ${newPassword}\n- Login URL: ${loginUrl}\n\nSystem Details:\n- IP Address: ${ip}\n- Device: ${userAgent}\n- Time: ${timestamp}\n\nIf you did not authorize this change, please contact support immediately.\n\nBest Regards,\nGrowffiy Security Team`,
            html: `
              <div style="font-family: sans-serif; padding: 24px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <h2 style="color: #0ea5e9; font-weight: 800; margin: 0; font-size: 24px; letter-spacing: -0.5px;">GROWFFIY</h2>
                  <span style="font-size: 10px; font-weight: 700; color: #0ea5e9; background-color: #e0f2fe; padding: 4px 12px; border-radius: 99px; text-transform: uppercase; margin-top: 8px; display: inline-block;">Security Update</span>
                </div>
                
                <p>Hello <strong>${user.name}</strong>,</p>
                <p>The password for your Growffiy account has been updated successfully.</p>
                
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
                  <h4 style="margin: 0 0 12px 0; color: #0f172a; font-size: 14px;">Updated Credentials Details:</h4>
                  <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 6px 0; color: #64748b; width: 120px;"><strong>User ID:</strong></td>
                      <td style="padding: 6px 0; color: #0f172a;"><code>${user.userId}</code></td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #64748b;"><strong>New Password:</strong></td>
                      <td style="padding: 6px 0; color: #0f172a;"><code>${newPassword}</code></td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #64748b;"><strong>Login URL:</strong></td>
                      <td style="padding: 6px 0;"><a href="${loginUrl}" style="color: #0ea5e9; text-decoration: underline; font-weight: 600;">${loginUrl}</a></td>
                    </tr>
                  </table>
                </div>

                <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 12px;">
                  <h4 style="margin: 0 0 8px 0; color: #991b1b; font-size: 13px;">💻 System & Session Details:</h4>
                  <table style="width: 100%; border-collapse: collapse; color: #7f1d1d;">
                    <tr>
                      <td style="padding: 4px 0; width: 120px;"><strong>IP Address:</strong></td>
                      <td style="padding: 4px 0;"><code>${ip}</code></td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0;"><strong>Browser/Device:</strong></td>
                      <td style="padding: 4px 0; word-break: break-all;"><code>${userAgent}</code></td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0;"><strong>Timestamp:</strong></td>
                      <td style="padding: 4px 0;"><code>${timestamp}</code></td>
                    </tr>
                  </table>
                </div>

                <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-top: 24px;">
                  If you did not authorize this password change, please contact support immediately.
                </p>
                <div style="margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
                  © 2026 Growffiy Inc. All rights reserved.
                </div>
              </div>
            `
          });
        } catch (mailErr) {
          console.error('Failed to send client security notification email:', mailErr);
        }
      }

      return NextResponse.json({ success: true, message: 'Password updated successfully' });
    }

    // Case 2: Profile details update (name, email)
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) {
      // Check if email already in use
      if (email !== user.email) {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
          return NextResponse.json({ success: false, error: 'Email already in use' }, { status: 400 });
        }
      }
      updateData.email = email;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: 'No update parameters provided' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        userId: updatedUser.userId,
        role: updatedUser.role
      }
    });

  } catch (error: any) {
    console.error('Profile/Password update error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User identifier is required' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { userId: userId },
          { email: userId }
        ]
      },
      include: {
        subscriptions: {
          include: {
            plan: true
          },
          orderBy: {
            endDate: 'desc'
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        userId: user.userId,
        role: user.role,
        subscriptions: user.subscriptions
      }
    });
  } catch (error: any) {
    console.error('Fetch profile error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
