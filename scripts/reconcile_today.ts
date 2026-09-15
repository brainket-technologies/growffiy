import { prisma } from '../src/database/db';
import { KiteClient } from '../src/shared/services/kite';
import { logSystemEvent } from '../src/shared/services/auditLogger';

async function main() {
  console.log('Starting manual EOD reconciliation for today...');
  
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const failedTrades = await prisma.trade.findMany({
    where: {
      status: 'FAILED',
      exitReason: { contains: 'Exit failed' },
      createdAt: { gte: todayStart }
    },
    include: { client: { include: { user: true } }, strategy: true }
  });

  if (failedTrades.length === 0) {
    console.log('No failed trades found for today.');
    return;
  }

  console.log(`Found ${failedTrades.length} failed trades to reconcile.`);

  const tradesByClient = new Map<string, typeof failedTrades>();
  for (const trade of failedTrades) {
    const clientId = trade.clientId;
    if (!tradesByClient.has(clientId)) tradesByClient.set(clientId, []);
    tradesByClient.get(clientId)!.push(trade);
  }

  for (const [clientId, trades] of tradesByClient) {
    const client = trades[0].client;
    if (!client.zerodhaApiKey || !client.accessToken) continue;

    console.log(`\nFetching Kite orders for client: ${client.user?.name}...`);
    try {
      const ordersRes = await KiteClient.getOrders(client.zerodhaApiKey, client.accessToken, (client.proxyUrl || client.dedicatedIp));
      
      if (ordersRes?.status === 'success' && Array.isArray(ordersRes.data)) {
        const kiteOrders = ordersRes.data;

        for (const trade of trades) {
          const isShortTrade = (trade.direction === 'SHORT');
          const expectedExitTransactionType = isShortTrade ? 'BUY' : 'SELL';
          const expectedProduct = trade.orderType || 'MIS';

          const matchingOrder = kiteOrders.find((o: any) =>
            o.tradingsymbol === trade.symbol &&
            o.transaction_type === expectedExitTransactionType &&
            o.product === expectedProduct &&
            o.status === 'COMPLETE' &&
            new Date(o.order_timestamp).getTime() > new Date(trade.createdAt).getTime()
          );

          if (matchingOrder && matchingOrder.average_price > 0) {
            const actualExitPrice = Number(matchingOrder.average_price);
            const entryPrice = Number(trade.entryPrice);
            const pnlValue = isShortTrade
              ? (entryPrice - actualExitPrice) * trade.quantity
              : (actualExitPrice - entryPrice) * trade.quantity;

            await prisma.trade.update({
              where: { id: trade.id },
              data: {
                status: 'closed',
                exitPrice: actualExitPrice,
                exitReason: 'Broker Auto-Square Off (Manual Sync)',
                pnl: pnlValue,
                exitTime: new Date(matchingOrder.order_timestamp),
              }
            });

            await prisma.strategyLog.create({
              data: {
                strategyId: trade.strategyId,
                message: `Trade Reconciled for ${client.user?.name}: ${isShortTrade ? 'Covered (Short)' : 'Sold (Long)'} ${trade.quantity} ${trade.symbol} @ ₹${actualExitPrice.toFixed(2)} (Manual Sync). P&L: ₹${pnlValue.toFixed(2)}`,
                logType: 'trade'
              }
            });

            await logSystemEvent({
              action: 'MANUAL EOD TRADE RECONCILED',
              oldValue: `Trade ID: ${trade.id} | Status: FAILED | Fallback Exit: ₹${trade.exitPrice}`,
              newValue: `Status: closed | Actual Exit: ₹${actualExitPrice.toFixed(2)} | P&L: ₹${pnlValue.toFixed(2)}`
            });

            console.log(`✅ Reconciled trade ${trade.id} for ${client.user?.name}. New Exit Price: ₹${actualExitPrice}, P&L: ₹${pnlValue.toFixed(2)}`);
          } else {
            console.log(`❌ No matching completed exit order found in Kite for trade ${trade.id}.`);
          }
        }
      } else {
        console.warn(`Failed to fetch Kite orders for client ${client.user?.name}.`);
      }
    } catch (err) {
      console.error(`Error processing client ${client.user?.name}:`, err);
    }
  }
  
  console.log('\nManual reconciliation complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
