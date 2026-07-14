import { NextResponse } from 'next/server';
import { prisma } from '../../../../../database/db';
import { inMemoryStaff } from '../../../../../shared/store/inMemoryStaff';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const staff = await prisma.staff.findUnique({
      where: { id },
      include: { permissions: true },
    });
    if (!staff) return NextResponse.json({ success: false, error: 'Staff not found' }, { status: 404 });
    // Sync in-memory store with DB
    const memIdx = inMemoryStaff.findIndex((s: any) => s.id === id);
    if (memIdx !== -1) {
      Object.assign(inMemoryStaff[memIdx], staff, {
        permissions: staff.permissions.map((p: any) => ({
          module: p.module,
          permission: p.permission,
          granted: p.granted,
        })),
      });
    } else {
      inMemoryStaff.push({ ...staff, permissions: staff.permissions.map((p: any) => ({
        module: p.module,
        permission: p.permission,
        granted: p.granted,
      })) });
    }
    return NextResponse.json({ success: true, staff });
  } catch (e) {
    const staff = inMemoryStaff.find((s: any) => s.id === id);
    if (!staff) return NextResponse.json({ success: false, error: 'Staff not found' }, { status: 404 });
    return NextResponse.json({ success: true, staff, isDemoMode: true });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { name, email, mobile, userId, password, status, permissions } = body;

  try {
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (mobile !== undefined) updateData.mobile = mobile;
    if (userId !== undefined) updateData.userId = userId;
    if (password !== undefined) updateData.password = password;
    if (status !== undefined) updateData.status = status;

    if (permissions) {
      await prisma.staffPermission.deleteMany({ where: { staffId: id } });
      await prisma.staffPermission.createMany({
        data: permissions.map((p: { module: string; permission: string; granted?: boolean }) => ({
          staffId: id,
          module: p.module,
          permission: p.permission,
          granted: p.granted ?? true,
        })),
      });
    }

    const updated = await prisma.staff.update({
      where: { id },
      data: updateData,
      include: { permissions: true },
    });

    // Keep in-memory store in sync with DB
    const memIdx = inMemoryStaff.findIndex((s: any) => s.id === id);
    if (memIdx !== -1) {
      if (name !== undefined) inMemoryStaff[memIdx].name = name;
      if (email !== undefined) inMemoryStaff[memIdx].email = email;
      if (mobile !== undefined) inMemoryStaff[memIdx].mobile = mobile;
      if (userId !== undefined) inMemoryStaff[memIdx].userId = userId;
      if (password !== undefined) inMemoryStaff[memIdx].password = password;
      if (status !== undefined) inMemoryStaff[memIdx].status = status;
      if (permissions !== undefined) inMemoryStaff[memIdx].permissions = permissions;
    }

    return NextResponse.json({ success: true, staff: updated });
  } catch (err: any) {
    // In-memory fallback for update
    const idx = inMemoryStaff.findIndex((s: any) => s.id === id);
    if (idx === -1) return NextResponse.json({ success: false, error: 'Staff not found' }, { status: 404 });

    if (name !== undefined) inMemoryStaff[idx].name = name;
    if (email !== undefined) inMemoryStaff[idx].email = email;
    if (mobile !== undefined) inMemoryStaff[idx].mobile = mobile;
    if (userId !== undefined) inMemoryStaff[idx].userId = userId;
    if (password !== undefined) inMemoryStaff[idx].password = password;
    if (status !== undefined) inMemoryStaff[idx].status = status;
    if (permissions !== undefined) inMemoryStaff[idx].permissions = permissions;

    return NextResponse.json({ success: true, staff: inMemoryStaff[idx], isDemoMode: true });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.staff.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    const idx = inMemoryStaff.findIndex((s: any) => s.id === id);
    if (idx === -1) return NextResponse.json({ success: false, error: 'Staff not found' }, { status: 404 });
    inMemoryStaff.splice(idx, 1);
    return NextResponse.json({ success: true, isDemoMode: true });
  }
}
