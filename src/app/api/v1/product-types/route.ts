import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';

export async function GET() {
  try {
    const productTypes = await prisma.productType.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: productTypes,
    });
  } catch (error) {
    console.error('Failed to fetch product types:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch product types' },
      { status: 500 }
    );
  }
}
