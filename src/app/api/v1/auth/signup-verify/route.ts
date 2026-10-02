import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import jwt from 'jsonwebtoken';
import { sendClientWelcomeEmail } from '@/shared/services/mail';

const JWT_SECRET = process.env.JWT_SECRET || 'growffi-secret-key-fallback';

export async function POST(request: Request) {
  try {
    const headers = request.headers;
    const deviceType = headers.get('x-device-type');
    const appVersion = headers.get('x-app-version');
    const deviceId = headers.get('x-device-id');
    const apiKey = headers.get('x-api-key');
    const fcmToken = headers.get('x-fcm-token');

    const EXPECTED_API_KEY = process.env.MOBILE_API_KEY || 'YOUR_API_KEY';

    if (!deviceType || !appVersion || !deviceId || !apiKey) {
      return NextResponse.json(
        { success: false, error: 'Missing required device or app headers' },
        { status: 400 }
      );
    }

    if (apiKey !== EXPECTED_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Invalid API Key' },
        { status: 401 }
      );
    }

    const body = await request.json();
    let { email, otp } = body;

    if (email) email = email.trim();
    if (otp) otp = otp.trim();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.status === 'active') {
       return NextResponse.json(
        { success: false, error: 'User is already verified and active.' },
        { status: 400 }
       );
    }

    if (user.resetOtp !== otp) {
      return NextResponse.json(
        { success: false, error: 'Invalid OTP' },
        { status: 400 }
      );
    }

    if (user.resetOtpExpiry && user.resetOtpExpiry < new Date()) {
      return NextResponse.json(
        { success: false, error: 'OTP has expired' },
        { status: 400 }
      );
    }

    // Mark as active
    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: 'active',
        resetOtp: null,
        resetOtpExpiry: null
      }
    });
    
    // Check if Client object exists, if not, create it
    let client = await prisma.client.findUnique({
      where: { userId: user.id }
    });
    
    if (!client) {
      client = await prisma.client.create({
        data: {
          userId: user.id,
          capital: 0,
          tradingStatus: 'inactive',
          subscriptionStatus: 'pending',
          kycStatus: 'unverified'
        }
      });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { 
        id: user.id, 
        userId: user.userId, 
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Upsert user device info in database
    if (deviceId) {
      await prisma.userDevice.upsert({
        where: { deviceId: deviceId },
        update: {
          deviceType,
          appVersion,
          fcmToken,
          token,
          userId: user.id,
          lastActive: new Date()
        },
        create: {
          deviceId,
          deviceType,
          appVersion,
          fcmToken,
          token,
          userId: user.id
        }
      });
    }
    
    // Send welcome email to new user (non-blocking)
    try {
      const originUrl = request.headers.get('origin') || request.headers.get('host') || 'http://localhost:3000';
      const formattedOrigin = originUrl.startsWith('http') ? originUrl : `https://${originUrl}`;
      const loginUrl = `${formattedOrigin}/login`;
      sendClientWelcomeEmail({
        email: user.email,
        name: user.name,
        userId: user.userId,
        passwordHashOrPlain: '(your registered password)',
        loginUrl
      }).catch(err => console.error('Background welcome email error:', err));
    } catch (mailErr) {
      console.error('Mail dispatch setup error:', mailErr);
    }
    
    // Now return exact same response format as login API
    return NextResponse.json(
      {
        success: true,
        message: 'OTP verified and login successful',
        data: {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            userId: user.userId,
            mobile: user.mobile,
            role: user.role,
            status: 'active',
            createdAt: user.createdAt,
            client: {
              id: client.id,
              tradingStatus: client.tradingStatus,
              subscriptionStatus: client.subscriptionStatus,
              kycStatus: client.kycStatus,
              panNumber: client.panNumber,
              aadhaarNumber: client.aadhaarNumber,
              dob: client.dob,
              productTypeId: client.productTypeId,
              accessToken: client.accessToken,
              network: {
                dedicatedIp: client.dedicatedIp,
                proxyUrl: client.proxyUrl
              },
              zerodha: {
                clientId: client.zerodhaClientId,
                apiKey: client.zerodhaApiKey,
                apiSecret: client.zerodhaApiSecret,
                password: client.zerodhaPassword,
                totpSecret: client.zerodhaTotpSecret
              },
              trade: {
                perDayTradeAmount: client.perDayTradeAmount,
                capital: client.capital,
                strategyId: []
              }
            }
          }
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
