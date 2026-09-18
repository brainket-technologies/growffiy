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
    const { panNumber, aadhaarNumber, dob } = body;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { client: true }
    });

    if (!user || !user.client) {
      return NextResponse.json(
        { success: false, error: 'User or client profile not found' },
        { status: 404 }
      );
    }

    const updatedClient = await prisma.client.update({
      where: { userId: user.id },
      data: {
        panNumber: panNumber || user.client.panNumber,
        aadhaarNumber: aadhaarNumber || user.client.aadhaarNumber,
        dob: dob || user.client.dob,
        kycStatus: 'pending'
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: 'KYC details updated successfully',
        data: updatedClient
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('KYC update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
