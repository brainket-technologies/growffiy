import { NextResponse } from 'next/server';
import { prisma } from '../../../../database/db';
import { inMemoryClients } from '../../clients/route';
import { sendClientOtpEmail } from '../../../../shared/services/mail';

// In-memory OTP store (Key: zerodhaClientId, Value: { otp, email, expires })
const otpStore = new Map<string, { otp: string; email: string; name: string; expires: number }>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, zerodhaClientId, otp, newPassword } = body;

    if (!zerodhaClientId) {
      return NextResponse.json({ success: false, error: 'Zerodha Client ID is required' }, { status: 400 });
    }

    const cleanClientId = zerodhaClientId.trim();

    // ═══ 1. ACTION: SEND OTP ═══
    if (action === 'send-otp') {
      let clientEmail = '';
      let clientName = '';
      let isDbUser = false;
      let dbUserRef: any = null;

      // Check DB first
      try {
        const dbClient = await prisma.client.findFirst({
          where: { zerodhaClientId: cleanClientId },
          include: { user: true }
        });

        if (dbClient && dbClient.user) {
          clientEmail = dbClient.user.email;
          clientName = dbClient.user.name;
          isDbUser = true;
          dbUserRef = dbClient.user;
        }
      } catch (err) {
        console.warn('DB lookup failed in forgot-password OTP send:', err);
      }

      // If not in DB, check inMemoryClients fallback
      if (!isDbUser) {
        const mockClient = inMemoryClients.find(
          c => c.zerodhaClientId?.toLowerCase() === cleanClientId.toLowerCase()
        );
        if (mockClient && mockClient.user) {
          clientEmail = mockClient.user.email;
          clientName = mockClient.user.name;
        }
      }

      if (!clientEmail) {
        return NextResponse.json({ success: false, error: 'No registered user found with this Zerodha Client ID' }, { status: 404 });
      }

      // Generate 6 digit verification code (OTP)
      const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
      const expires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

      // Save to store
      otpStore.set(cleanClientId.toLowerCase(), {
        otp: generatedOtp,
        email: clientEmail,
        name: clientName,
        expires
      });

      // Send email (non-blocking)
      try {
        await sendClientOtpEmail({
          email: clientEmail,
          name: clientName,
          otp: generatedOtp
        });
      } catch (emailErr: any) {
        console.error('Failed to dispatch OTP email:', emailErr);
        // During dev/fallback, if SMTP is not configured, print OTP to console so developer can see it
        console.log(`[DEV OTP BYPASS] OTP for ${cleanClientId} (${clientEmail}): ${generatedOtp}`);
      }

      // Mask the email for response security (e.g. v***h@gmail.com)
      const parts = clientEmail.split('@');
      const emailLocal = parts[0];
      const maskedLocal = emailLocal.length > 2 
        ? emailLocal[0] + '*'.repeat(emailLocal.length - 2) + emailLocal[emailLocal.length - 1]
        : emailLocal[0] + '*';
      const maskedEmail = `${maskedLocal}@${parts[1]}`;

      return NextResponse.json({ 
        success: true, 
        message: 'Verification code sent to your registered email address',
        maskedEmail 
      });
    }

    // ═══ 2. ACTION: RESET PASSWORD ═══
    if (action === 'reset-password') {
      if (!otp) {
        return NextResponse.json({ success: false, error: 'Verification code (OTP) is required' }, { status: 400 });
      }
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ success: false, error: 'Password must be at least 6 characters long' }, { status: 400 });
      }

      const storeKey = cleanClientId.toLowerCase();
      const savedOtpInfo = otpStore.get(storeKey);

      if (!savedOtpInfo) {
        return NextResponse.json({ success: false, error: 'No active password reset session found for this Client ID' }, { status: 400 });
      }

      if (savedOtpInfo.expires < Date.now()) {
        otpStore.delete(storeKey);
        return NextResponse.json({ success: false, error: 'Verification code has expired. Please request a new OTP' }, { status: 400 });
      }

      if (savedOtpInfo.otp !== otp.trim()) {
        return NextResponse.json({ success: false, error: 'Invalid verification code. Please check and try again' }, { status: 400 });
      }

      // OTP matches! Update password.
      let updated = false;

      // Update in DB
      try {
        const dbClient = await prisma.client.findFirst({
          where: { zerodhaClientId: cleanClientId },
          include: { user: true }
        });

        if (dbClient && dbClient.user) {
          await prisma.user.update({
            where: { id: dbClient.userId },
            data: { password: newPassword.trim() }
          });
          updated = true;
        }
      } catch (err) {
        console.warn('DB update failed in forgot-password reset:', err);
      }

      // Update in memory fallback if DB user not updated
      if (!updated) {
        const mockClient = inMemoryClients.find(
          c => c.zerodhaClientId?.toLowerCase() === cleanClientId.toLowerCase()
        );
        if (mockClient && mockClient.user) {
          mockClient.user.password = newPassword.trim();
          updated = true;
        }
      }

      if (!updated) {
        return NextResponse.json({ success: false, error: 'Failed to reset password. User not found' }, { status: 500 });
      }

      // Success - clear OTP
      otpStore.delete(storeKey);

      return NextResponse.json({ success: true, message: 'Password has been successfully updated' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action specified' }, { status: 400 });

  } catch (error: any) {
    console.error('Forgot password API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error occurred' }, { status: 500 });
  }
}
