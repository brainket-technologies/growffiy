import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';

export async function GET(request: Request) {
  try {
    const clients = await prisma.client.findMany({
      where: {
        kycStatus: 'pending'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            userId: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: clients
    });
  } catch (error: any) {
    console.error('Fetch pending KYC requests error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientId, status } = body;

    if (!clientId || !status || (status !== 'verified' && status !== 'rejected')) {
      return NextResponse.json(
        { success: false, error: 'Invalid input. Missing clientId or invalid status.' },
        { status: 400 }
      );
    }

    const client = await prisma.client.update({
      where: { id: clientId },
      data: { kycStatus: status }
    });

    return NextResponse.json({
      success: true,
      message: `KYC request ${status} successfully.`,
      data: client
    });
  } catch (error: any) {
    console.error('Update KYC status error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
