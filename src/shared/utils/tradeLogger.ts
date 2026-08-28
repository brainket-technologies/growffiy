import { prisma } from '../../database/db';

export interface FailedTradeLegFields {
  direction: string;
  legName: string;
  legTimeframe: string;
  dualLegGroupId: string | null;
  quantity?: number;
  stopLoss?: number;
  target?: number;
  slTriggerPrice?: number;
}

/**
 * Log a FAILED trade to DB (trade + strategyLog).
 *
 * Guard: Skips if a trade (any status) already exists today for the same
 *        client + strategy + leg — prevents duplicate FAILED entries.
 */
export async function logFailedTrade(
  client: any,
  strategy: any,
  symbol: string,
  orderType: string,
  entryPrice: number,
  reason: string,
  legFields?: FailedTradeLegFields
): Promise<void> {
  try {
    // Guard: Do not log duplicate if already exists today for same client+strategy+leg
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const alreadyLogged = await prisma.trade.findFirst({
      where: {
        clientId: client.id,
        strategyId: strategy.id,
        legName: legFields?.legName ?? null,
        createdAt: { gte: todayStart }
      }
    });

    if (alreadyLogged) {
      console.log(
        `logFailedTrade: FAILED trade already logged today for ${client.user.name} ` +
        `(${symbol}, leg: ${legFields?.legName ?? 'none'}). Skipping duplicate.`
      );
      return;
    }

    await prisma.trade.create({
      data: {
        clientId: client.id,
        strategyId: strategy.id,
        symbol,
        orderType,
        entryPrice: entryPrice || 0,
        quantity: legFields?.quantity ?? 0,
        stopLoss: legFields?.stopLoss ?? null,
        target: legFields?.target ?? null,
        slTriggerPrice: legFields?.slTriggerPrice ?? null,
        status: 'FAILED',
        entryTime: new Date(),
        entryOrderStatus: 'FAILED',
        kiteResponse: { message: reason },
        ...(legFields
          ? {
              direction: legFields.direction,
              legName: legFields.legName,
              legTimeframe: legFields.legTimeframe,
              dualLegGroupId: legFields.dualLegGroupId
            }
          : {})
      }
    });

    await prisma.strategyLog.create({
      data: {
        strategyId: strategy.id,
        message: `Trade skipped for ${client.user.name} (${symbol}): ${reason}`,
        logType: 'warning'
      }
    });

    console.log(`logFailedTrade: FAILED trade logged for ${client.user.name} (${symbol}) — ${reason}`);
  } catch (e) {
    console.error(`logFailedTrade: Error logging failed trade for ${symbol}:`, e);
  }
}
