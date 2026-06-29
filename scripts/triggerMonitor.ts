import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { prisma } from '../src/database/db';
import { algoEngine } from '../src/shared/models/algoEngine';

async function main() {
    console.log("Starting manual trigger of Active Trades Monitor to process via API...");
    
    // Get the trading scheduler from the engine
    const scheduler = (algoEngine as any).tradingScheduler;
    
    // We can simulate the checkOpenTradesExits logic here, but it's private.
    // Instead, let's just initialize the engine which starts the scheduler, 
    // and let it run for 10 seconds.
    await algoEngine.init();
    
    console.log("Scheduler started. Waiting 15 seconds for it to process open trades via API...");
    await new Promise(r => setTimeout(r, 15000));
    
    console.log("Checking database for PERSISTENT trade status...");
    const trade = await prisma.trade.findFirst({
        where: { entryOrderId: '260629170102587' }
    });
    
    if (trade) {
        console.log(`PERSISTENT Trade Status: ${trade.status}`);
        console.log(`SL Order ID: ${trade.slOrderId || 'None'}`);
        console.log(`Target Order ID: ${trade.targetOrderId || 'None'}`);
    } else {
        console.log("PERSISTENT trade not found.");
    }
    
    console.log("Checking database for HINDZINC trade status...");
    const hindzinc = await prisma.trade.findFirst({
        where: { entryOrderId: '260625170115615' }
    });
    
    if (hindzinc) {
        console.log(`HINDZINC Trade Status: ${hindzinc.status}`);
    }
    
    process.exit(0);
}

main().catch(console.error);
