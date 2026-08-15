import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';

export async function GET() {
  try {
    const dbSettings = await prisma.appSettings.findMany();
    const map: Record<string, string> = {};
    dbSettings.forEach((s) => {
      map[s.key] = s.value;
    });

    const appName = map.app_name || 'Growffiy';
    const appTitle = map.app_title || `${appName} - Institutional Algo Trading Platform`;
    const appLogo = map.app_logo || '/logo.png';

    const manifest = {
      name: appTitle,
      short_name: appName,
      description: map.meta_description || 'Advanced automated algorithmic trading platform, client portfolio management, and strategy executor.',
      start_url: '/',
      display: 'standalone',
      background_color: '#090d16',
      theme_color: '#090d16',
      orientation: 'portrait-primary',
      icons: [
        {
          src: appLogo,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: appLogo,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: appLogo,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ]
    };

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=60, s-maxage=60'
      }
    });
  } catch (error) {
    // Fallback if DB fetch fails
    return NextResponse.json({
      name: 'Growffiy - Institutional Algo Trading Platform',
      short_name: 'Growffiy',
      description: 'Advanced automated algorithmic trading platform',
      start_url: '/',
      display: 'standalone',
      background_color: '#090d16',
      theme_color: '#090d16',
      orientation: 'portrait-primary',
      icons: [
        {
          src: '/logo.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/logo.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        }
      ]
    });
  }
}
