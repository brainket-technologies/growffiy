import { NextResponse } from 'next/server';
import { prisma } from '../../../../database/db';

export async function GET() {
  try {
    const productTypes = await prisma.productType.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json({ success: true, productTypes });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
