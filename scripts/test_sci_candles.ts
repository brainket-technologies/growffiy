import { prisma } from '../src/database/db';
import { KiteClient } from '../src/shared/services/kite';
import { getMasterClient } from '../src/shared/utils/masterClient';

async function main() {
  const masterClient = await getMasterClient();
  if (!masterClient || !masterClient.accessToken) {
    console.log("No master client");
    return;
  }

  const dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const from = dateStr + ' 09:15:00';
  const to = dateStr + ' 10:01:00';
  
  // SCI symbol is "SCI", instrument token might be 780289 based on screenshot URL (kite.zerodha.com/markets/chart/web/ciq/NSE/SCI/780289)
  const token = 780289; 

  console.log(`Fetching candles for SCI (token: ${token}) from ${from} to ${to}`);

  const candles = await KiteClient.getHistoricalData(
    masterClient.zerodhaApiKey,
    masterClient.accessToken,
    token,
    '15minute',
    from,
    to
  );

  console.log("Candles API response:");
  console.dir(candles, { depth: null });
  
  if (candles?.data?.candles) {
      const hist = candles.data.candles;
      const pattern = hist.map((c: any) => c[4] > c[1] ? 'G' : 'R');
      console.log("Pattern:", pattern);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
