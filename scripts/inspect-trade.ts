import { prisma } from '../src/database/db';
import { KiteClient } from '../src/shared/services/kite';

async function main() {
  const client = await prisma.client.findFirst({
    where: { user: { name: 'Vikash sharma' } }
  });

  if (!client || !client.zerodhaApiKey || !client.accessToken) {
    console.log('Client credentials not found');
    return;
  }

  // TATAELXSI token is 873217
  const token = '873217';
  const today = '2026-07-15';

  const res15m = await KiteClient.getHistoricalData(
    client.zerodhaApiKey,
    client.accessToken,
    token,
    '15minute',
    today,
    today
  );

  console.log('15m Candles response:', JSON.stringify(res15m, null, 2));

  const res5m = await KiteClient.getHistoricalData(
    client.zerodhaApiKey,
    client.accessToken,
    token,
    '5minute',
    today,
    today
  );

  console.log('5m Candles response:', JSON.stringify(res5m, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());




