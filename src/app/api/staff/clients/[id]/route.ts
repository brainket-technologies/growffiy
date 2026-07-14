import { NextResponse } from 'next/server';
import { prisma } from '../../../../../database/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const client = await prisma.client.findUnique({
      where: { id },
      include: { user: true, strategy: true, productType: true },
    });
    if (!client) return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    return NextResponse.json({ success: true, client });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
