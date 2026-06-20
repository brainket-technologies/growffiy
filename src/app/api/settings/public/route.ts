import { NextResponse } from 'next/server';
import { prisma } from '../../../../database/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dbSettings = await prisma.appSettings.findMany();
    const settings: Record<string, string> = {};
    dbSettings.forEach((s) => {
      settings[s.settingKey] = s.settingValue;
    });

    const mode = settings['razorpay_mode'] || 'test';
    const keyId = mode === 'live' 
      ? (settings['razorpay_live_key_id'] || '') 
      : (settings['razorpay_test_key_id'] || '');

    return NextResponse.json({ 
      success: true, 
      razorpayKeyId: keyId,
      mode,
      supportEmail: settings['support_email'] || 'support@growffiy.com',
      supportPhone: settings['support_phone'] || '+91 98765 43210',
      supportTimings: settings['support_timings'] || 'Live Chat (Mon-Fri, 9:00 AM - 3:30 PM)'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

