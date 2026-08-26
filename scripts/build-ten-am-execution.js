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

    if (!mwSnapshot || !mwSnapshot.data) {
      console.log('AlgoEngine TenAM: No 09:30 snapshot found.');
      return;
    }

    const nseData = mwSnapshot.data as any[];
    const sortedStocks = [...nseData].sort((a, b) => (b.pChange || 0) - (a.pChange || 0));
    
    // 1. Master Client Fetching
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

      // TODO: Loop through gainers/losers and use masterClient.accessToken and KiteClient.getHistoricalData 
      // to find the exact GRG / RGR matched stock. We do this ONCE for the group.
      let targetGainer = gainers[0]; // Placeholder for matched GRG stock
      let targetLoser = losers[0];   // Placeholder for matched RGR stock

      // 2. Client Loop & Division
      for (const client of group.assignedClients) {
        if (client.tradingStatus !== 'active' || !client.zerodhaApiKey) continue;

        const activeAccessToken = client.accessToken; 
        const marginResult = await calculateClientCapitalAndRisk({
          client, activeAccessToken, onCacheMargin: (cId, margin) => this.engine.marginCache.set(cId, margin), config
        });
        if (!marginResult.success) continue;

        const legDivisor = activeLegs.length;
        const capitalAtRiskPerLeg = marginResult.capitalAtRisk / legDivisor;
        const buyingPowerPerLeg = marginResult.clientCapital / legDivisor;

        // 3. Trade Execution Sequence
        for (const leg of activeLegs) {
           const targetStock = (leg.direction || '').toLowerCase() === 'buy' ? targetGainer : targetLoser;
           if (!targetStock) continue;
           
           /* 
           // Real Circuit Check
           const { lower, upper } = await getFreshCircuitLimits(client, "NSE", targetStock.symbol, activeAccessToken);
           if (calculatedEntry <= lower || calculatedEntry >= upper) {
               console.log(\`Entry skipped: Stock \${targetStock.symbol} hit Circuit limits\`);
               continue; 
           }
           */
           
           // Placeholder for exact order placement logic and 30-sec delay
           console.log(\`Ready to place order for \${client.user?.name}, Leg: \${leg.name}, Risk: \${capitalAtRiskPerLeg}\`);
        }
      }
    }
  }
`;

const startIndex = code.indexOf('  async executePreOpenTrades(');
if (startIndex !== -1) {
  // Find the end of this method. 
  // It's the last method in the class, so we can replace everything until the last closing brace.
  const endOfFileIndex = code.lastIndexOf('}');
  const updatedCode = code.substring(0, startIndex) + newExecutionMethod.trim() + '\n}\n';
  fs.writeFileSync(filePath, updatedCode, 'utf8');
  console.log('Successfully injected Master Client logic into tenAmStrategy.ts');
} else {
  console.log('Could not find executePreOpenTrades');
}
