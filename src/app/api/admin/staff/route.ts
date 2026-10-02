import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import { getDefaultPermissions } from '../../../../core/constants';

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables early in API routes
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Seed removed. Relying on DB only.

import { getCachedData, invalidateCache } from '../../../../shared/utils/redis';

export async function GET() {
  try {
    const staff = await getCachedData('all_staff', async () => {
      return await prisma.staff.findMany({
        include: { permissions: true },
      });
    }, 30);
    return NextResponse.json({ success: true, staff });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: 'Database query failed: ' + e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, mobile, userId, password, permissions = [] } = body;

    const generatedUserId = userId || `staff_${Date.now()}`;
    const finalPassword = password || 'staff_123';

    try {
      const newStaff = await prisma.staff.create({
        data: {
          name,
          email,
          mobile,
          userId: generatedUserId,
          password: finalPassword,
          adminId: 'admin',
          permissions: {
            create: permissions.map((p: { module: string; permission: string; granted?: boolean }) => ({
              module: p.module,
              permission: p.permission,
              granted: p.granted ?? false,
            })),
          },
        },
        include: { permissions: true },
      });

      return NextResponse.json({ success: true, staff: newStaff });
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
