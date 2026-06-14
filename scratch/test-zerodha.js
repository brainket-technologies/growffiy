const fs = require('fs');

const fnoSymbols = [
  'ASHOKLEY', 'HINDPETRO', 'TATASTEEL', 'VEDL', 'HINDZINC', 'RVNL', 'YESBANK', 'MOTILALOFS', 'PNB', 'CANBK',
  'ZEEL', 'GMRAIRPORT', 'SAIL', 'NATIONALUM', 'NMDC', 'TATAPOWER', 'PFC', 'RECLTD', 'BHEL', 'GAIL',
  'ONGC', 'COALINDIA', 'BEL', 'WIPRO', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'RELIANCE', 'TCS', 'INFY',
  'AXISBANK', 'KOTAKBANK', 'TMCV', 'BAJFINANCE', 'BHARTIARTL', 'ITC', 'HINDUNILVR', 'LT', 'SUNPHARMA', 'NTPC',
  'MARUTI', 'JSWSTEEL', 'APOLLOTYRE', 'BIOCON', 'BANDHANBNK', 'DLF', 'GLENMARK', 'METROPOLIS', 'SUNTV', 'JUBLFOOD',
  'ESCORTS', 'IDEA', 'AMBUJACEM', 'ACC', 'ADANIENT', 'ADANIPORTS', 'AUROPHARMA', 'BALRAMCHIN', 'BATAINDIA', 'BERGEPAINT',
  'BHARATFORG', 'BOSCHLTD', 'CHAMBLFERT', 'CHOLAFIN', 'COFORGE', 'CONCOR', 'COROMANDEL', 'CUMMINSIND', 'DABUR', 'DEEPAKNTR',
  'DELTACORP', 'EXIDEIND', 'FEDERALBNK', 'GODREJCP', 'GODREJPROP', 'HAL', 'HAVELLS', 'SAMMAANCAP', 'INDHOTEL', 'IOC',
  'IPCALAB', 'JSWENERGY', 'LTF', 'LICHSGFIN', 'LTM', 'LUPIN', 'MANAPPURAM', 'MGL', 'MPHASIS', 'MRF',
  'MUTHOOTFIN', 'PIRAMALFIN', 'PETRONET', 'PIDILITIND', 'POLYCAB', 'POWERGRID', 'RAMCOCEM', 'SRF', 'TATACHEM', 'TATACOMM',
  'TECHM', 'TRENT', 'TVSMOTOR', 'UBL', 'ULTRACEMCO', 'VOLTAS', 'WHIRLPOOL'
];

async function main() {
  console.log('Downloading instruments file...');
  const res = await fetch('https://api.kite.trade/instruments');
  const csv = await res.text();
  const lines = csv.split('\n');
  
  const tokenMap = {};
  
  for (const line of lines) {
    const cols = line.split(',');
    if (cols.length >= 12 && cols[11].trim() === 'NSE') {
      const token = parseInt(cols[0].trim());
      const symbol = cols[2].trim();
      
      if (fnoSymbols.includes(symbol)) {
        tokenMap[symbol] = token;
      }
    }
  }
  
  console.log('Correct instrument tokens for F&O symbols:');
  const output = {};
  for (const symbol of fnoSymbols) {
    if (tokenMap[symbol]) {
      output[tokenMap[symbol]] = symbol;
    } else {
      console.warn(`Token not found for: ${symbol}`);
    }
  }
  
  console.log(JSON.stringify(output, null, 2));
}

main().catch(console.error);
