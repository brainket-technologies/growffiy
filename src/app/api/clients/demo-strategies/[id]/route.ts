import { NextResponse } from 'next/server';
import { prisma } from '../../../../../database/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, description, status, configJson } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'Strategy ID is required' }, { status: 400 });
    }

    const updated = await prisma.demoStrategy.update({
      where: { id },
      data: {
        name,
        description,
        status,
        configJson
      }
    });

    return NextResponse.json({ success: true, strategy: updated });
  } catch (error: any) {
    console.error('Failed to update demo strategy:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Strategy ID is required' }, { status: 400 });
    }

    await prisma.demoStrategy.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete demo strategy:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
