import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import { getCachedData } from '../../../../shared/utils/redis';

export async function GET() {
  try {
    const productTypes = await getCachedData('v1_product_types', () =>
      prisma.productType.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    120); // 2 min cache

    return NextResponse.json({ success: true, data: productTypes });
  } catch (error) {
    console.error('Failed to fetch product types:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch product types' },
      { status: 500 }
    );
  }
}
