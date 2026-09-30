import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const clientId = (await params).id;
    const body = await request.json();
    const { status } = body;

    if (!status || !['active', 'blocked', 'deleted'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status provided.' },
        { status: 400 }
      );
    }

    // Find the client to get the associated User
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { userId: true }
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found.' },
        { status: 404 }
      );
    }

    let updateData = {};
    if (status === 'blocked') {
      updateData = { isBlocked: true, isDeleted: false };
    } else if (status === 'deleted') {
      updateData = { isDeleted: true };
    } else if (status === 'active') {
      updateData = { isBlocked: false, isDeleted: false };
    }

    // Update the User status
    await prisma.user.update({
      where: { id: client.userId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: `Account status updated to ${status}.`
    });
  } catch (error: any) {
    console.error('Update account status error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
