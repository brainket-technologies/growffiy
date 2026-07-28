export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '../../../../database/db';

export async function GET() {
  try {
    // 1. Check if custom static IP is configured in DB settings
    const customIpSetting = await prisma.appSettings.findUnique({
      where: { settingKey: 'server_static_ip' }
    });

    if (customIpSetting && customIpSetting.settingValue) {
      return NextResponse.json({ success: true, ip: customIpSetting.settingValue.trim(), source: 'custom' });
    }

    // 2. Otherwise auto-detect server public IP via ipify
    try {
      const res = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.ip) {
          return NextResponse.json({ success: true, ip: data.ip, source: 'auto' });
        }
      }
    } catch (e) {
      console.warn('Failed to fetch public IP from ipify:', e);
    }

    return NextResponse.json({ success: true, ip: '127.0.0.1', source: 'fallback' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
