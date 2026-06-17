import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { price: 'asc' }
    });
    
    // Parse features JSON for convenience
    const mappedPlans = plans.map(p => {
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
    const { name, price, durationDays, features, status } = body;

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
        status: status || 'active'
      }
    });

    return NextResponse.json({ success: true, plan: newPlan });
  } catch (error: any) {
    console.error('Failed to create subscription plan:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create plan' }, { status: 500 });
  }
}
