import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'growffi-secret-key-fallback';

export async function GET(request: Request) {
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

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
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
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Profile fetched successfully',
        data: {
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
            productTypeId: user.client.productTypeId,
            accessToken: user.client.accessToken,
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
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
