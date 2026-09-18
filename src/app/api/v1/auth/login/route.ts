import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { decryptText } from '../../../../../shared/utils/crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'growffi-secret-key-fallback';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: 'Identifier and password are required' },
        { status: 400 }
      );
    }

    // Find user by email, userId, or zerodhaClientId (via Client relation)
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { userId: identifier },
          { client: { zerodhaClientId: identifier } }
        ]
      },
      include: {
        client: {
          include: {
            assignments: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    let isMatch = false;
    
    // 1. Try AES Decryption (New Standard)
    if (!isMatch) {
      try {
        const decryptedDbPassword = decryptText(user.password);
        if (decryptedDbPassword === password) {
          isMatch = true;
        }
      } catch(e) {}
    }
    
    // 2. Try Bcrypt Compare (Legacy fallback)
    if (!isMatch) {
      try {
        isMatch = await bcrypt.compare(password, user.password);
      } catch(e) {}
    }
    
    // 3. Fallback: If both fail, check if it's plain text directly
    if (!isMatch && password === user.password) {
      isMatch = true;
    }

    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
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

    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            userId: user.userId,
            mobile: user.mobile,
            role: user.role,
            status: user.status,
            createdAt: user.createdAt,
            client: user.client ? {
              id: user.client.id,
              tradingStatus: user.client.tradingStatus,
              subscriptionStatus: user.client.subscriptionStatus,
              kycStatus: user.client.kycStatus,
              panNumber: user.client.panNumber,
              aadhaarNumber: user.client.aadhaarNumber,
              dob: user.client.dob,
              network: {
                dedicatedIp: user.client.dedicatedIp,
                proxyUrl: user.client.proxyUrl
              },
              zerodha: {
                clientId: user.client.zerodhaClientId,
                apiKey: user.client.zerodhaApiKey,
                apiSecret: user.client.zerodhaApiSecret,
                password: user.client.zerodhaPassword,
                totpSecret: user.client.zerodhaTotpSecret
              },
              trade: {
                perDayTradeAmount: user.client.perDayTradeAmount,
                capital: user.client.capital,
                strategyId: user.client.assignments?.map((a: any) => a.strategyId) || []
              }
            } : null
          }
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
