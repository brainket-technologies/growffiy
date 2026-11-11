import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import { masterDataCache } from '@/shared/models/algo/masterDataCache';

export async function GET() {
  try {
    const setting = await prisma.appSettings.findUnique({
      where: { settingKey: 'global_excluded_stocks' }
    });

    let excludedStocks: string[] = [];
    if (setting && setting.settingValue) {
      try {
        const parsed = JSON.parse(setting.settingValue);
        if (Array.isArray(parsed)) {
          excludedStocks = parsed.map(s => String(s || '').toUpperCase().trim()).filter(Boolean);
        }
      } catch (e) {
        console.error('Failed to parse global_excluded_stocks JSON:', e);
      }
    }

    // Sync in-memory cache
    masterDataCache.setExcludedStocks(excludedStocks);

    return NextResponse.json({
      success: true,
      excludedStocks: Array.from(new Set(excludedStocks)).sort()
    });
  } catch (error: any) {
    console.error('Error fetching excluded stocks:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch excluded stocks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawList = Array.isArray(body?.excludedStocks) ? body.excludedStocks : [];

    // Sanitize and deduplicate symbols
    const cleanSymbols: string[] = Array.from(
      new Set<string>(
        rawList
          .map((s: any) => String(s || '').toUpperCase().trim().replace(/[^A-Z0-9&-]/g, ''))
          .filter(Boolean)
      )
    ).sort();

    await prisma.appSettings.upsert({
      where: { settingKey: 'global_excluded_stocks' },
      update: {
        settingValue: JSON.stringify(cleanSymbols),
        type: 'json'
      },
      create: {
        settingKey: 'global_excluded_stocks',
        settingValue: JSON.stringify(cleanSymbols),
        type: 'json'
      }
    });

    // Sync active in-memory cache instantly
    masterDataCache.setExcludedStocks(cleanSymbols);

    return NextResponse.json({
      success: true,
      excludedStocks: cleanSymbols,
      message: `Successfully updated ${cleanSymbols.length} excluded stocks.`
    });
  } catch (error: any) {
    console.error('Error saving excluded stocks:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to save excluded stocks' }, { status: 500 });
  }
}
