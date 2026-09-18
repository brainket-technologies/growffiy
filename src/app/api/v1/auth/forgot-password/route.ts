import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import nodemailer from 'nodemailer';

// Dynamic SMTP configuration will be fetched from database

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier } = body;

    if (!identifier) {
      return NextResponse.json(
        { success: false, error: 'Identifier (Email/Username/Zerodha ID) is required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { userId: identifier },
          { client: { zerodhaClientId: identifier } }
        ]
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found with this identifier' },
        { status: 404 }
      );
    }

    // Generate 4 digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiry = new Date(Date.now() + 10 * 60000); // 10 minutes from now

    // Save OTP to user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetOtp: otp,
        resetOtpExpiry: expiry,
      }
    });

    // Fetch SMTP settings from database
    const settings = await prisma.appSettings.findMany({
      where: {
        settingKey: {
          in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_encryption', 'smtp_sender_name', 'smtp_status']
        }
      }
    });

    const getSetting = (key: string, defaultValue: string = '') => {
      const setting = settings.find(s => s.settingKey === key);
      return setting ? setting.settingValue : defaultValue;
    };

    const smtpStatus = getSetting('smtp_status', 'false');
    const smtpHost = getSetting('smtp_host', process.env.SMTP_HOST || '');
    const smtpPort = parseInt(getSetting('smtp_port', process.env.SMTP_PORT || '587'));
    const smtpUser = getSetting('smtp_user', process.env.SMTP_USER || '');
    const smtpPass = getSetting('smtp_password', process.env.SMTP_PASS || '');
    const smtpSenderName = getSetting('smtp_sender_name', 'Growffi');
    const smtpEncryption = getSetting('smtp_encryption', 'tls');

    // Send OTP via email if SMTP is configured and enabled
    if (smtpStatus === 'true' && smtpHost && smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpEncryption === 'ssl' || smtpPort === 465, 
        auth: {
          user: smtpUser, 
          pass: smtpPass, 
        },
      });

      await transporter.sendMail({
        from: `"${smtpSenderName}" <${smtpUser}>`,
        to: user.email,
        subject: "Growffi - Password Reset OTP",
        text: `Your OTP for resetting your password is ${otp}. It will expire in 10 minutes.`,
        html: `<p>Your OTP for resetting your password is <b>${otp}</b>.</p><p>It will expire in 10 minutes.</p>`,
      });
    } else {
      console.warn("SMTP credentials not set, OTP not emailed:", otp);
    }

    // Mask email for user friendly response
    const emailParts = user.email.split('@');
    let maskedEmail = user.email;
    if (emailParts.length === 2) {
      const name = emailParts[0];
      const domain = emailParts[1];
      if (name.length > 2) {
        maskedEmail = `${name[0]}***${name[name.length - 1]}@${domain}`;
      } else {
        maskedEmail = `${name[0]}***@${domain}`;
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `OTP has been sent to your registered email (${maskedEmail})`,
        data: {}
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
