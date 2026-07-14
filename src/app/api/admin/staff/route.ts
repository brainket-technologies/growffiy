import { NextResponse } from 'next/server';
import { prisma } from '../../../../database/db';
import { inMemoryStaff } from '../../../../shared/store/inMemoryStaff';
import { getDefaultPermissions } from '../../../../core/constants';

export { inMemoryStaff };

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables early in API routes
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Seed removed. Relying on DB only.

export async function GET() {
  try {
    const staff = await prisma.staff.findMany({
      include: { permissions: true },
    });
    // Sync in-memory store with DB so fallback has current data
    inMemoryStaff.length = 0;
    inMemoryStaff.push(...staff.map((s: any) => ({
      ...s,
      permissions: s.permissions.map((p: any) => ({
        module: p.module,
        permission: p.permission,
        granted: p.granted,
      })),
    })));
    return NextResponse.json({ success: true, staff });
  } catch (e) {
    return NextResponse.json({ success: true, staff: inMemoryStaff, isDemoMode: true });
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

      // Sync in-memory store with DB
      const memIdx = inMemoryStaff.findIndex((s: any) => s.id === newStaff.id);
      if (memIdx !== -1) {
        Object.assign(inMemoryStaff[memIdx], newStaff, {
          permissions: newStaff.permissions.map((p: any) => ({
            module: p.module,
            permission: p.permission,
            granted: p.granted,
          })),
        });
      } else {
        inMemoryStaff.push({ ...newStaff, permissions: newStaff.permissions.map((p: any) => ({
          module: p.module,
          permission: p.permission,
          granted: p.granted,
        })) });
      }

      return NextResponse.json({ success: true, staff: newStaff });
    } catch (e: any) {
      const mockStaff = {
        id: `staff_${Date.now()}`,
        name,
        email,
        mobile,
        userId: generatedUserId,
        password: finalPassword,
        status: 'active',
        adminId: 'admin',
        permissions: permissions.map((p: any) => ({
          id: `perm_${Date.now()}_${p.module}_${p.permission}`,
          staffId: `staff_${Date.now()}`,
          module: p.module,
          permission: p.permission,
          granted: p.granted ?? false,
        })),
      };
      inMemoryStaff.push(mockStaff);
      return NextResponse.json({ success: true, staff: mockStaff, isDemoMode: true });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
