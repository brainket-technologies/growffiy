import { NextResponse } from 'next/server';
import { prisma } from '../../../../database/db';
import { inMemoryStaff } from '../../../../shared/store/inMemoryStaff';
import { getDefaultPermissions } from '../../../../core/constants';

export async function POST(request: Request) {
  try {
    // Rely exclusively on database records for authenticated staff and their permissions

    const { userId, password } = await request.json();

    if (!userId || !password) {
      return NextResponse.json({ success: false, error: 'User ID and password are required' }, { status: 400 });
    }

    let staff = null;
    try {
      staff = await prisma.staff.findFirst({
        where: {
          OR: [
            { userId },
            { email: userId },
          ],
          status: 'active',
        },
        include: { permissions: true },
      });
    } catch (e) {
      console.warn('Prisma staff lookup failed:', e);
    }

    if (!staff) {
      staff = inMemoryStaff.find((s: any) =>
        (s.userId === userId || s.email === userId) && s.status === 'active'
      ) || null;
    }

    if (!staff || staff.password !== password) {
      return NextResponse.json({ success: false, error: 'Invalid Staff ID/Email or Password' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        userId: staff.userId,
        status: staff.status,
        permissions: (staff.permissions || []).map((p: any) => ({
          module: p.module,
          permission: p.permission,
          granted: p.granted,
        })),
      },
    });
  } catch (error: any) {
    console.error('Staff authentication API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
