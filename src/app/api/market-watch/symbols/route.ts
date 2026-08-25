import { NextRequest, NextResponse } from 'next/server';
import { fetchStocksByNSEIndex } from '../../../../shared/utils/marketWatchHelper';

const CATEGORY_INDEX_MAP: Record<string, string> = {
  'All': 'NIFTY 500',
  'F&O': 'NIFTY 50',
  'SME': 'NIFTY SMALLCAP 100',
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const category = url.searchParams.get('category') || 'All';
  const indexName = CATEGORY_INDEX_MAP[category] || category;

  try {
    const symbols = await fetchStocksByNSEIndex(indexName);
    return NextResponse.json({ success: true, symbols, indexName });
  } catch (e: any) {
    return NextResponse.json({ success: false, symbols: [], error: e.message }, { status: 500 });
  }
}
