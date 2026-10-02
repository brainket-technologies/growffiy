import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import { getCachedData, invalidateCache } from '../../../shared/utils/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dbPlans = await getCachedData('admin_plans', async () => {
      return prisma.subscriptionPlan.findMany({
        include: { productType: true },
        orderBy: { price: 'asc' }
      });
    }, 120); // 2 min cache
    
    // Parse features JSON for convenience
    const mappedPlans = dbPlans.map((p: any) => {
      let parsedFeatures = [];
      try {
        parsedFeatures = p.features ? JSON.parse(p.features) : [];
      } catch (e) {
        parsedFeatures = p.features ? p.features.split(',') : [];
      }
      return {
        ...p,
        features: parsedFeatures
      };
    });

    return NextResponse.json({ success: true, plans: mappedPlans });
  } catch (error: any) {
    console.error('Failed to fetch subscription plans:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch plans' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, price, durationDays, features, status, productTypeId } = body;

    if (!name || price === undefined || !durationDays) {
      return NextResponse.json({ success: false, error: 'Name, price, and durationDays are required' }, { status: 400 });
    }

    const featuresString = Array.isArray(features) 
      ? JSON.stringify(features) 
      : JSON.stringify(features ? String(features).split(',').map(f => f.trim()) : []);

    const newPlan = await prisma.subscriptionPlan.create({
      data: {
        name,
        price: parseFloat(String(price)),
        durationDays: parseInt(String(durationDays), 10),
        features: featuresString,
        status: status || 'active',
        productTypeId: productTypeId || null
      }
    });

    await invalidateCache('admin_plans');
    await invalidateCache('client_plans:*');
    return NextResponse.json({ success: true, plan: newPlan });
  } catch (error: any) {
    console.error('Failed to create subscription plan:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create plan' }, { status: 500 });
  }
}
