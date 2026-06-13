import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';

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
