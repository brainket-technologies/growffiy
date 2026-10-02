import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import { getCachedData } from '../../../../shared/utils/redis';

export async function GET() {
  try {
    const productTypes = await getCachedData('admin_product_types', () =>
      prisma.productType.findMany({ orderBy: { name: 'asc' } }),
    120); // 2 min — product types rarely change
    return NextResponse.json({ success: true, productTypes });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
