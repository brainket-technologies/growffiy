import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

import { prisma } from '../src/database/db';

async function recoverTrade() {
  const orderId = process.argv[2];
  const clientName = process.argv[3];

  if (!orderId || !clientName) {
    console.log('Usage: npx ts-node scripts/recoverOrphanedTrade.ts <orderId> <clientName>');
    console.log('Example: npx ts-node scripts/recoverOrphanedTrade.ts 260625170115615 "Vikash sharma"');
    process.exit(1);
  }

  const existing = await prisma.trade.findFirst({ where: { entryOrderId: orderId } });
  if (existing) {
    console.log(`Trade already exists for order ${orderId} (tradeId: ${existing.id})`);
    process.exit(0);
  }

  const client = await prisma.client.findFirst({
    where: { user: { name: clientName } },
    include: { user: true, strategy: true }
  });

  if (!client) {
    console.error(`Client "${clientName}" not found`);
    process.exit(1);
  }

  const strategy = client.strategy;
  let config: any = {};
  if (strategy?.configJson) {
    config = JSON.parse(strategy.configJson);
  }

  const entryPrice = 531.65;
  
  let slPercent = config.stoploss?.fixedPercent || 1;
  let targetPercent = config.target?.profitPercent || 2;
  
  let slPoints = entryPrice * (slPercent / 100);
  
  const slType = config.stoploss?.type;
  if (slType === 'Fixed Points' && config.stoploss?.fixedPoints) {
    slPoints = config.stoploss.fixedPoints;
  } else if (slType === 'Risk %' && config.stoploss?.riskPercent) {
    slPoints = entryPrice * (config.stoploss.riskPercent / 100);
  }
  
  const targetType = config.target?.type;
  let target = 0;
  if (targetType === 'Risk Reward Ratio' && config.target?.riskRewardRatio) {
    target = entryPrice + (slPoints * config.target.riskRewardRatio);
  } else {
    target = entryPrice * (1 + targetPercent / 100);
  }
  
  const stopLoss = entryPrice - slPoints;

  const trade = await prisma.trade.create({
    data: {
      clientId: client.id,
      strategyId: client.strategyId!,
      symbol: 'HINDZINC',
      orderType: 'SL-M',
      entryPrice: entryPrice,
      quantity: 66,
      stopLoss: stopLoss,
      target: target,
      originalEntryPrice: entryPrice,
      originalStopLoss: stopLoss,
      originalTarget: target,
      status: 'open',
      entryTime: new Date('2026-06-25T09:20:00+05:30'),
      entryOrderId: orderId,
      kiteResponse: { recovered: true, note: 'Recovered orphaned order from Kite' }
    }
  });

  console.log(`Trade recovered: ${trade.id} for ${client.user.name} / HINDZINC (order: ${orderId})`);
}

recoverTrade().catch(console.error).finally(() => prisma.$disconnect());
