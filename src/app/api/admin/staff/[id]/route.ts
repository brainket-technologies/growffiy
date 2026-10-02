import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const staff = await prisma.staff.findUnique({
      where: { id },
      include: { permissions: true },
    });
    if (!staff) return NextResponse.json({ success: false, error: 'Staff not found' }, { status: 404 });
    return NextResponse.json({ success: true, staff });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: 'Database query failed: ' + e.message }, { status: 500 });
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

    return NextResponse.json({ success: true, staff: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Failed to update: ' + err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.staff.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Failed to delete: ' + err.message }, { status: 500 });
  }
}
