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
      supportTimings: settings['support_timings'] || 'Live Chat (Mon-Fri, 9:00 AM - 3:30 PM)',
      appName: settings['app_name'] || 'Growffiy',
      appLogo: settings['app_logo'] || '',
      heroTitle: settings['hero_title'] || 'Automate Your<br /><span class="text-gradient">Stock Market</span><br />Trades Smarter',
      heroSubtitle: settings['hero_subtitle'] || 'Growffiy connects to your Zerodha Kite API and executes pre-open momentum breakout strategies with strict 1% risk management — fully automated.'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

