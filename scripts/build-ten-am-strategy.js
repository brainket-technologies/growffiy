const fs = require('fs');

// We will construct the new tenAmStrategy.ts
const code = `import { prisma } from '../../../../database/db';
import { KiteClient } from '../../../services/kite';
import { calculateClientCapitalAndRisk } from '../../../utils/marginHelper';
import { logSystemEvent } from '../../../services/auditLogger';
import { API_ENDPOINTS } from '../../../../core/constants';
import { concurrentMap } from '../../../../core/helpers';
import { getTickSizeAndRound } from '../../../utils/tickSizeUtil';
import { getLatestOrderState } from '../../../utils/kiteHelper';
import { performKiteAutoLogin } from '../../../services/kiteAutoLogin';
import { StockQuote, getPreOpenStocks } from '../../../utils/preOpenFetcher';
import { matchesConditions } from '../../../utils/conditionEvaluator';
import { getFreshCircuitLimits } from '../../../utils/circuitLimitHelper';
import { fetchClientsByStrategy } from '../clientSelector';
import { getMasterClient } from '../../../utils/masterClient';
import { logFailedTrade } from '../../../utils/tradeLogger';

function mapTimeframeToKiteInterval(tf: string): string {
  if (!tf) return '15minute';
  const map: Record<string, string> = {
    '1m': 'minute', '3m': '3minute', '5m': '5minute', '10m': '10minute',
    '15m': '15minute', '30m': '30minute', '60m': '60minute', '1h': '60minute', '1d': 'day'
  };
  return map[tf.toLowerCase()] || '15minute';
}

export class TenAmStrategy {
  private engine: any;

  constructor(engine: any) {
    this.engine = engine;
  }

  async preSelectAllClients(strategyId?: string): Promise<void> {
    this.engine.preselectedStockByStrategy.clear();
    this.engine.marginCache.clear();
    try { await prisma.strategyPreselect.deleteMany(); } catch (e) { }

    const dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const mwSnapshot = await prisma.marketWatchSnapshot.findUnique({
      where: { indexName_date_timeSlot: { indexName: 'NIFTY 500', date: dateStr, timeSlot: '09:30' } }
    });

    if (!mwSnapshot || !mwSnapshot.data) return;
    const nseData = mwSnapshot.data as any[];
    if (!Array.isArray(nseData) || nseData.length === 0) return;

    const sortedStocks = [...nseData].sort((a, b) => (b.pChange || 0) - (a.pChange || 0));
    const topGainers = sortedStocks.slice(0, 20);
    const topLosers = sortedStocks.slice(-20).reverse();

    const preOpenStocks: StockQuote[] = [...topGainers, ...topLosers].map(s => ({
      symbol: s.symbol, name: s.companyName || s.symbol, ltp: s.lastPrice || 0,
      open: s.open || 0, high: s.dayHigh || 0, low: s.dayLow || 0,
      prevClose: s.previousClose || 0, volume: s.totalTradedVolume || 0,
      change: s.change || 0, changePercent: s.pChange || 0, iep: s.lastPrice || 0,
      final: s.lastPrice || 0, finalQuantity: s.totalTradedVolume || 0, value: s.totalTradedValue || 0,
      ffmCap: 0, nm52wH: s.yearHigh || 0, nm52wL: s.yearLow || 0,
      isNifty50: false, isNifty500: true, isBankNifty: false, isFo: false
    }));

    const strategyGroups = await fetchClientsByStrategy(true);
    if (strategyGroups.length === 0) return;

    const filteredGroups = strategyId ? strategyGroups.filter(g => g.strategyId === strategyId) : strategyGroups;

    for (const { strategyId: sId, strategyName, configJson, assignedClients: strategyClients } of filteredGroups) {
      const strategy = { id: sId, name: strategyName };
      if (!configJson) continue;
      const config: any = configJson;

      const segment = config.basicInfo?.segment;
      if (!segment) continue;

      let matchingStocks = preOpenStocks.filter((stock) => {
        if (segment === 'NSE F&O' || segment === 'Futures' || segment === 'Options') return stock.isFo;
        if (segment === 'Nifty 50' || segment === 'Nifty') return stock.isNifty50;
        if (segment === 'Bank Nifty' || segment === 'BankNifty') return stock.isBankNifty;
        return true;
      });

      if (matchingStocks.length === 0) continue;
      
      const topCount = config.basicInfo?.topCount || 20;
      // Re-split gainers and losers from the matched set based on topCount
      const gainers = matchingStocks.filter(s => s.changePercent > 0).slice(0, topCount);
      const losers = matchingStocks.filter(s => s.changePercent < 0).reverse().slice(0, topCount);

      const finalStocks = [...gainers, ...losers];

      try {
        const preselectData = finalStocks.map(stock => ({
          strategyId: strategy.id,
          symbol: stock.symbol,
          dataJson: JSON.stringify(stock)
        }));
        await prisma.strategyPreselect.createMany({ data: preselectData, skipDuplicates: true });
        this.engine.preselectedStockByStrategy.set(strategy.id, finalStocks);
        console.log(\`AlgoEngine preSelect: Saved \${finalStocks.length} pre-selected stocks for \${strategy.name}\`);
      } catch (err) {
        console.error('AlgoEngine preSelect: Error saving to DB:', err);
      }
    }
  }

  async executePreOpenTrades(adminId: string, mockStocks?: StockQuote[], strategyId?: string, legIndex?: number, dualLegGroupId?: string | null): Promise<void> {
    console.log('AlgoEngine: executePreOpenTrades (Ten AM) started.');
    
    // In next phase we will implement the 10AM execution loop here.
    // For now, it is stubbed to allow UI to compile without the massive 1200 lines of cloned code.
  }
}
`;

fs.writeFileSync('src/shared/models/algo/strategies/tenAmStrategy.ts', code, 'utf8');
console.log("tenAmStrategy.ts has been rewritten successfully!");
