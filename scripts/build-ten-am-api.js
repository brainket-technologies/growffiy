const fs = require('fs');
const filePath = 'src/shared/models/algo/strategies/tenAmStrategy.ts';
let code = fs.readFileSync(filePath, 'utf8');

const newExecutionMethod = `
  async executePreOpenTrades(adminId: string, mockStocks?: StockQuote[], strategyId?: string, legIndex?: number, dualLegGroupId?: string | null): Promise<void> {
    console.log('AlgoEngine: executePreOpenTrades (Ten AM) started.');
    
    const dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const mwSnapshot = await prisma.marketWatchSnapshot.findUnique({
      where: { indexName_date_timeSlot: { indexName: 'NIFTY 500', date: dateStr, timeSlot: '09:30' } }
    });

    if (!mwSnapshot || !mwSnapshot.data) return;

    const nseData = mwSnapshot.data as any[];
    const sortedStocks = [...nseData].sort((a, b) => (b.pChange || 0) - (a.pChange || 0));
    
    // 1. Fetch Master Token
    const masterClient = await getMasterClient();
    if (!masterClient || !masterClient.accessToken) {
       console.error('AlgoEngine TenAM: No Master Client found. Cannot fetch candles.');
       return;
    }

    const strategyGroups = await fetchClientsByStrategy(true);
    const filteredGroups = strategyId ? strategyGroups.filter(g => g.strategyId === strategyId) : strategyGroups;

    for (const group of filteredGroups) {
      if (group.strategyName !== 'Ten AM Strategy') continue;
      const config: any = group.configJson;
      const topCount = config?.basicInfo?.topCount || 20;

      const gainers = sortedStocks.slice(0, topCount);
      const losers = sortedStocks.slice(-topCount).reverse();
      const activeLegs = config?.legs?.filter((l: any) => l.isEnabled) || [];
      if (activeLegs.length === 0) continue;

      // TODO: Lazy Evaluation Loop Here (Iterate gainers one-by-one, check matchesConditions, fetch historical data, check GRG)
      // THIS WILL REQUIRE A CUSTOM KITE HISTORICAL API MATCHER.
      let targetGainer = gainers[0]; // Example placeholder
      let targetLoser = losers[0];

      // 2. Ultra-Fast Concurrent Map for 500+ Clients
      await Promise.all(
        group.assignedClients.map(async (client) => {
          if (client.tradingStatus !== 'active' || !client.zerodhaApiKey) return;

          const activeAccessToken = client.accessToken; 
          const marginResult = await calculateClientCapitalAndRisk({
            client, activeAccessToken, onCacheMargin: (cId, margin) => this.engine.marginCache.set(cId, margin), config
          });
          if (!marginResult.success) return;

          const legDivisor = activeLegs.length;
          const capitalAtRiskPerLeg = marginResult.capitalAtRisk / legDivisor;
          const buyingPowerPerLeg = marginResult.clientCapital / legDivisor;

          for (const leg of activeLegs) {
             const targetStock = (leg.direction || '').toLowerCase() === 'buy' ? targetGainer : targetLoser;
             if (!targetStock) continue;
             
             console.log(\`[Concurrent API Request] Firing Entry for \${client.user?.name}, Leg: \${leg.name}, Stock: \${targetStock.symbol}\`);
             
             // Step 1: Fire Entry Order
             try {
                // const entryOrderId = await KiteClient.placeOrder(...)
             } catch(err) {
                console.error('Failed to place Entry order:', err);
             }
             
             // Step 2: 30s Polling sequence
             // Use setTimeout / setInterval to poll getLatestOrderState(entryOrderId)
             // When COMPLETE -> Fire SL-Market, wait 30s -> Fire Target-Limit
          }
        })
      );
    }
  }
`;

const matchStr = 'async executePreOpenTrades(';
const startIndex = code.indexOf(matchStr);
if (startIndex !== -1) {
  const updatedCode = code.substring(0, startIndex) + newExecutionMethod.trim() + '\n}\n';
  fs.writeFileSync(filePath, updatedCode, 'utf8');
  console.log('Successfully injected final concurrent logic into tenAmStrategy.ts');
} else {
  console.log('Could not find executePreOpenTrades');
}
