import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { KiteClient } from '../src/shared/services/kite';
import { prisma } from '../src/database/db';
import { getLatestOrderState } from '../src/shared/utils/kiteHelper';

async function main() {
  const orderId = '260625170115615'; // HINDZINC cancelled order

  console.log(`Looking up trade with entryOrderId: ${orderId}`);
  const trade = await prisma.trade.findFirst({
    where: { entryOrderId: orderId },
    include: { client: true }
  });

  if (!trade) {
    console.log("Trade not found in database. Using PERSISTENT order as fallback.");
    const persistentOrderId = '260629170102587';
    const fallbackTrade = await prisma.trade.findFirst({
        where: { entryOrderId: persistentOrderId },
        include: { client: true }
    });
    if (!fallbackTrade) {
        console.log("Neither trade found. Exiting.");
        return;
    }
    await checkOrder(fallbackTrade.client, persistentOrderId);
    return;
  }

  await checkOrder(trade.client, orderId);

  console.log("\nNow checking PERSISTENT order (260629170102587)...");
  await checkOrder(trade.client, '260629170102587');
}

async function checkOrder(client: any, orderId: string) {
    if (!client.zerodhaApiKey || !client.accessToken) {
        console.log("Client missing API key or access token");
        return;
    }

    try {
        console.log(`Fetching from Kite API for order: ${orderId}`);
        const res = await KiteClient.getOrderById(client.zerodhaApiKey, client.accessToken, orderId);
        
        if (res.status === 'success') {
            console.log("\n=================================");
            console.log("Old Logic (reading data[0]):");
            const oldLogicState = Array.isArray(res.data) ? res.data[0] : res.data;
            console.log(`Status: ${oldLogicState?.status}`);
            
            console.log("\nNew Logic (reading last element via getLatestOrderState):");
            const newLogicState = getLatestOrderState(res.data);
            console.log(`Status: ${newLogicState?.status}`);
            console.log("=================================\n");
        } else {
            console.log("Kite API returned error:", res);
        }
    } catch (e) {
        console.error("Error fetching order from Kite:", e);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
