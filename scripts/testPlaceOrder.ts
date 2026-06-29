import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { prisma } from '../src/database/db';
import { KiteClient } from '../src/shared/services/kite';
import { getTickSizeAndRound } from '../src/shared/utils/tickSizeUtil';

async function main() {
    const trade = await prisma.trade.findFirst({
        where: { entryOrderId: '260629170102587' },
        include: { client: { include: { strategy: true } } }
    });
    
    if (!trade) {
        console.log("PERSISTENT trade not found.");
        return;
    }
    
    const client = trade.client;
    if (!client.zerodhaApiKey || !client.accessToken) {
        console.log("Missing API key or token");
        return;
    }

    const strategy = client.strategy;
    let config: any = {};
    if (strategy?.configJson) {
        config = JSON.parse(strategy.configJson);
    }
    
    const exchangeParam = config.basicInfo?.exchange || 'NSE';
    const marketProtectionVal = config?.tradeAction?.marketProtection !== undefined
        ? Number(config.tradeAction.marketProtection) : -1;
        
    const finalSlTrigger = await getTickSizeAndRound(client.zerodhaApiKey, client.accessToken, exchangeParam, trade.symbol, Number(trade.slTriggerPrice));
    
    const slParams = {
        exchange: exchangeParam, 
        tradingsymbol: trade.symbol,
        transaction_type: 'SELL' as const, 
        quantity: Number(trade.quantity),
        order_type: 'SL-M' as const, 
        product: trade.orderType as any,
        validity: 'DAY' as const,
        trigger_price: finalSlTrigger,
        market_protection: marketProtectionVal
    };

    console.log("Attempting to place SL order with params:", slParams);
    
    try {
        const slRes = await KiteClient.placeOrder(client.zerodhaApiKey, client.accessToken, slParams);
        console.log("Kite SL API Response:", slRes);
    } catch (e) {
        console.error("Exception placing SL:", e);
    }
    
    const finalTarget = await getTickSizeAndRound(client.zerodhaApiKey, client.accessToken, exchangeParam, trade.symbol, Number(trade.target));
    
    const targetParams = {
        exchange: exchangeParam, 
        tradingsymbol: trade.symbol,
        transaction_type: 'SELL' as const, 
        quantity: Number(trade.quantity),
        order_type: 'LIMIT' as const, 
        product: trade.orderType as any,
        validity: 'DAY' as const,
        price: finalTarget
    };
    
    console.log("Attempting to place Target order with params:", targetParams);
    
    try {
        const tgtRes = await KiteClient.placeOrder(client.zerodhaApiKey, client.accessToken, targetParams);
        console.log("Kite Target API Response:", tgtRes);
    } catch (e) {
        console.error("Exception placing Target:", e);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
