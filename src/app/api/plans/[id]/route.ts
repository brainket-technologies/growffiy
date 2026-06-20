export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '../../../../database/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, price, durationDays, features, status } = body;

    if (!name || price === undefined || !durationDays) {
      return NextResponse.json({ success: false, error: 'Name, price, and durationDays are required' }, { status: 400 });
    }

    const featuresString = Array.isArray(features) 
      ? JSON.stringify(features) 
      : JSON.stringify(features ? String(features).split(',').map(f => f.trim()) : []);

    const updatedPlan = await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        name,
        price: parseFloat(String(price)),
        durationDays: parseInt(String(durationDays), 10),
        features: featuresString,
        status: status || 'active'
      }
    });

    return NextResponse.json({ success: true, plan: updatedPlan });
  } catch (error: any) {
    console.error('Failed to update subscription plan:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update plan' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if there are active subscriptions using this plan
    const count = await prisma.subscription.count({
      where: { planId: id }
    });

    if (count > 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot delete plan: active client subscriptions exist under this plan.' 
      }, { status: 400 });
    }

    await prisma.subscriptionPlan.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Plan deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete subscription plan:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete plan' }, { status: 500 });
  }
}
