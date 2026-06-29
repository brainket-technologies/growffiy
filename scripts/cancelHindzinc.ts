import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { prisma } from '../src/database/db';

async function main() {
    const entryOrderId = '260625170115615';
    console.log(`Looking for HINDZINC trade with entryOrderId: ${entryOrderId}`);
    
    const trade = await prisma.trade.findFirst({
        where: { entryOrderId }
    });
    
    if (!trade) {
        console.log("Trade not found.");
        return;
    }
    
    console.log(`Current status: ${trade.status}`);
    
    await prisma.trade.update({
        where: { id: trade.id },
        data: {
            status: 'FAILED',
            exitReason: 'CANCELLED manually',
            kiteResponse: { error: 'Order cancelled on Zerodha (manually updated)' }
        }
    });
    
    console.log("Successfully updated trade status to FAILED (Cancelled).");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
