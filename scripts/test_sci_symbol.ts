import { prisma } from '../src/database/db';
import { KiteClient } from '../src/shared/services/kite';
import { getMasterClient } from '../src/shared/utils/masterClient';

async function main() {
  const masterClient = await getMasterClient();
  const dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  
  const from = dateStr + ' 09:15:00';
  const to = dateStr + ' 10:01:00';
  const token = 'SCI'; 

  console.log(`Fetching candles for ${token}`);

  try {
    const candles = await KiteClient.getHistoricalData(
      masterClient.zerodhaApiKey,
      masterClient.accessToken,
      token as any,
      '15minute',
      from,
      to
    );
    console.log("Candles API response:");
    console.dir(candles, { depth: null });
  } catch (err) {
      console.log("Error:", err);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
