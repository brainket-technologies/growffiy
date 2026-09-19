import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dbSettings = await prisma.appSettings.findMany();
    const settings: Record<string, string> = {};
    dbSettings.forEach((s) => {
      settings[s.settingKey] = s.settingValue;
    });

    return NextResponse.json({
      success: true,
      data: {
        // ── App Info ──────────────────────────────────
        appName: settings['app_name'] || 'Growffiy',
        appLogo: settings['app_logo'] || '',

        // ── Support Contact Details ───────────────────
        supportEmail:   settings['support_email']    || 'support@growffiy.com',
        supportPhone:   settings['support_phone']    || '+91 9026663052',
        supportWhatsapp: settings['support_whatsapp'] || '+91 902666305',
        supportTimings: settings['support_timings']  || 'Live Chat (Mon-Fri, 9:00 AM - 3:30 PM)',
        supportAddress: settings['support_address']  || 'Mumbai, India',

        // ── Social Media Links ────────────────────────
        socialTelegram:  settings['social_telegram']  || 'https://t.me/growffiy',
        socialYoutube:   settings['social_youtube']   || 'https://youtube.com/@growffiy',
        socialTwitter:   settings['social_twitter']   || 'https://x.com/growffiy',
        socialInstagram: settings['social_instagram'] || 'https://instagram.com/growffiy',
        socialFacebook:  settings['social_facebook']  || 'https://facebook.com/growffiy',
      }
    });
  } catch (error: any) {
    console.error('Error fetching app info:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}
