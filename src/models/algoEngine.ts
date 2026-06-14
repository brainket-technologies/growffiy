import { prisma } from '../lib/db';
import WebSocket from 'ws';

export interface StockQuote {
  symbol: string;
  name: string;
  ltp: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  volume: number;
  change: number;
  changePercent: number;
  // F&O segment specific columns matching NSE Market Watch
  iep: number;
  final: number;
  finalQuantity: number;
  value: number; // in Crores
  ffmCap: number; // in Crores
  nm52wH: number;
  nm52wL: number;
}

// Helper to generate F&O Securities
const generateFnOSecurities = (): StockQuote[] => {
  const fnoStocks = [
    { symbol: 'ASHOKLEY', name: 'Ashok Leyland Ltd.', price: 143.22, prevClose: 138.58, finalQuantity: 298391, value: 4.27, ffmCap: 40862.88, nm52wH: 215.42, nm52wL: 114.96 },
    { symbol: 'HINDPETRO', name: 'Hindustan Petroleum Corp. Ltd.', price: 377.70, prevClose: 365.70, finalQuantity: 68320, value: 2.58, ffmCap: 36168.91, nm52wH: 508.45, nm52wL: 316.20 },
    { symbol: 'TATASTEEL', name: 'Tata Steel Ltd.', price: 204.00, prevClose: 197.96, finalQuantity: 257382, value: 5.15, ffmCap: 164843.23, nm52wH: 224.40, nm52wL: 149.80 },
    { symbol: 'VEDL', name: 'Vedanta Limited', price: 314.00, prevClose: 304.90, finalQuantity: 232537, value: 7.30, ffmCap: 53204.73, nm52wH: 795.00, nm52wL: 268.70 },
    { symbol: 'HINDZINC', name: 'Hindustan Zinc Ltd.', price: 560.95, prevClose: 545.00, finalQuantity: 43127, value: 2.42, ffmCap: 24249.68, nm52wH: 733.00, nm52wL: 413.50 },
    { symbol: 'RVNL', name: 'Rail Vikas Nigam Ltd.', price: 228.50, prevClose: 222.19, finalQuantity: 42686, value: 0.98, ffmCap: 12934.71, nm52wH: 435.70, nm52wL: 221.55 },
    { symbol: 'YESBANK', name: 'Yes Bank Ltd.', price: 22.85, prevClose: 22.22, finalQuantity: 1494907, value: 3.42, ffmCap: 40021.72, nm52wH: 24.30, nm52wL: 17.20 },
    { symbol: 'MOTILALOFS', name: 'Motilal Oswal Financial Services Ltd.', price: 854.70, prevClose: 831.60, finalQuantity: 17167, value: 1.47, ffmCap: 13276.25, nm52wH: 1097.10, nm52wL: 614.90 },
    { symbol: 'PNB', name: 'Punjab National Bank', price: 124.50, prevClose: 121.20, finalQuantity: 843210, value: 10.45, ffmCap: 52120.30, nm52wH: 142.50, nm52wL: 92.10 },
    { symbol: 'CANBK', name: 'Canara Bank', price: 118.90, prevClose: 115.30, finalQuantity: 432100, value: 5.12, ffmCap: 28430.50, nm52wH: 132.40, nm52wL: 84.60 },
    { symbol: 'ZEEL', name: 'Zee Entertainment Enterprises Ltd.', price: 154.20, prevClose: 151.10, finalQuantity: 215300, value: 3.32, ffmCap: 14820.60, nm52wH: 198.50, nm52wL: 132.40 },
    { symbol: 'GMRINFRA', name: 'GMR Airports Infrastructure Ltd.', price: 88.50, prevClose: 86.40, finalQuantity: 624500, value: 5.52, ffmCap: 10920.40, nm52wH: 102.40, nm52wL: 78.50 },
    { symbol: 'SAIL', name: 'Steel Authority of India Ltd.', price: 148.90, prevClose: 145.20, finalQuantity: 312500, value: 4.65, ffmCap: 22480.90, nm52wH: 178.50, nm52wL: 118.40 },
    { symbol: 'NATIONALUM', name: 'National Aluminium Co. Ltd.', price: 179.80, prevClose: 184.20, finalQuantity: 184200, value: 3.31, ffmCap: 12840.50, nm52wH: 212.50, nm52wL: 142.10 },
    { symbol: 'NMDC', name: 'NMDC Limited', price: 232.40, prevClose: 227.10, finalQuantity: 154200, value: 3.58, ffmCap: 18430.60, nm52wH: 278.40, nm52wL: 198.50 },
    { symbol: 'TATAPOWER', name: 'Tata Power Co. Ltd.', price: 432.10, prevClose: 421.40, finalQuantity: 312500, value: 13.50, ffmCap: 48930.50, nm52wH: 492.40, nm52wL: 382.40 },
    { symbol: 'PFC', name: 'Power Finance Corporation Ltd.', price: 482.50, prevClose: 471.20, finalQuantity: 192800, value: 9.30, ffmCap: 38450.20, nm52wH: 524.50, nm52wL: 412.30 },
    { symbol: 'RECLTD', name: 'REC Limited', price: 512.40, prevClose: 498.90, finalQuantity: 184300, value: 9.42, ffmCap: 41230.60, nm52wH: 562.40, nm52wL: 432.10 },
    { symbol: 'BHEL', name: 'Bharat Heavy Electricals Ltd.', price: 284.10, prevClose: 276.50, finalQuantity: 312500, value: 8.87, ffmCap: 24390.80, nm52wH: 312.40, nm52wL: 212.40 },
    { symbol: 'GAIL', name: 'GAIL (India) Ltd.', price: 212.30, prevClose: 206.90, finalQuantity: 212500, value: 4.51, ffmCap: 28930.50, nm52wH: 242.40, nm52wL: 178.50 },
    { symbol: 'ONGC', name: 'Oil & Natural Gas Corporation Ltd.', price: 268.40, prevClose: 261.20, finalQuantity: 412300, value: 11.05, ffmCap: 45620.30, nm52wH: 298.50, nm52wL: 212.40 },
    { symbol: 'COALINDIA', name: 'Coal India Ltd.', price: 472.50, prevClose: 459.80, finalQuantity: 212400, value: 10.02, ffmCap: 38420.50, nm52wH: 512.40, nm52wL: 398.50 },
    { symbol: 'BEL', name: 'Bharat Electronics Ltd.', price: 292.10, prevClose: 284.60, finalQuantity: 312500, value: 9.12, ffmCap: 32450.60, nm52wH: 324.50, nm52wL: 232.10 },
    { symbol: 'WIPRO', name: 'Wipro Ltd.', price: 462.40, prevClose: 452.10, finalQuantity: 184300, value: 8.52, ffmCap: 24830.40, nm52wH: 524.50, nm52wL: 382.40 },
    { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', price: 1582.42, prevClose: 1618.00, finalQuantity: 412300, value: 65.20, ffmCap: 184390.20, nm52wH: 1724.50, nm52wL: 1382.40 },
    { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', price: 1112.50, prevClose: 1098.40, finalQuantity: 284300, value: 31.60, ffmCap: 124500.30, nm52wH: 1210.40, nm52wL: 948.50 },
    { symbol: 'SBIN', name: 'State Bank of India', price: 828.50, prevClose: 814.90, finalQuantity: 312500, value: 25.80, ffmCap: 98430.50, nm52wH: 890.50, nm52wL: 682.40 },
    { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', price: 2912.40, prevClose: 2875.00, finalQuantity: 412300, value: 120.05, ffmCap: 384500.60, nm52wH: 3120.40, nm52wL: 2382.40 },
    { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.', price: 3824.50, prevClose: 3768.90, finalQuantity: 112400, value: 42.90, ffmCap: 198420.50, nm52wH: 4250.40, nm52wL: 3420.50 },
    { symbol: 'INFY', name: 'Infosys Ltd.', price: 1482.40, prevClose: 1456.20, finalQuantity: 184300, value: 27.30, ffmCap: 98430.50, nm52wH: 1682.40, nm52wL: 1284.50 },
    { symbol: 'AXISBANK', name: 'Axis Bank Ltd.', price: 1184.20, prevClose: 1162.30, finalQuantity: 215400, value: 25.50, ffmCap: 64830.40, nm52wH: 1284.50, nm52wL: 942.50 },
    { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd.', price: 1724.50, prevClose: 1698.40, finalQuantity: 112300, value: 19.30, ffmCap: 78430.50, nm52wH: 1980.50, nm52wL: 1542.10 },
    { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd.', price: 962.40, prevClose: 945.10, finalQuantity: 312500, value: 30.05, ffmCap: 84320.50, nm52wH: 1045.20, nm52wL: 682.40 },
    { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd.', price: 6982.50, prevClose: 6875.00, finalQuantity: 43200, value: 30.10, ffmCap: 112450.60, nm52wH: 7850.40, nm52wL: 6124.50 },
    { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd.', price: 1384.20, prevClose: 1356.40, finalQuantity: 212500, value: 29.40, ffmCap: 98450.60, nm52wH: 1492.40, nm52wL: 1120.40 },
    { symbol: 'ITC', name: 'ITC Ltd.', price: 432.40, prevClose: 424.10, finalQuantity: 512400, value: 22.10, ffmCap: 74830.20, nm52wH: 498.50, nm52wL: 398.50 },
    { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd.', price: 2482.50, prevClose: 2452.10, finalQuantity: 112300, value: 27.80, ffmCap: 84320.50, nm52wH: 2780.40, nm52wL: 2232.10 },
    { symbol: 'LT', name: 'Larsen & Toubro Ltd.', price: 3582.40, prevClose: 3512.60, finalQuantity: 112400, value: 40.20, ffmCap: 128450.60, nm52wH: 3920.50, nm52wL: 3120.40 },
    { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries Ltd.', price: 1512.40, prevClose: 1489.20, finalQuantity: 112300, value: 16.90, ffmCap: 64320.50, nm52wH: 1682.40, nm52wL: 1198.50 },
    { symbol: 'NTPC', name: 'NTPC Ltd.', price: 362.40, prevClose: 354.10, finalQuantity: 412500, value: 14.90, ffmCap: 42450.60, nm52wH: 398.50, nm52wL: 312.40 },
    { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd.', price: 12100.00, prevClose: 11950.00, finalQuantity: 12400, value: 15.02, ffmCap: 68420.50, nm52wH: 13450.00, nm52wL: 9850.00 },
    { symbol: 'JSWSTEEL', name: 'JSW Steel Ltd.', price: 892.40, prevClose: 876.10, finalQuantity: 184200, value: 16.42, ffmCap: 38450.60, nm52wH: 968.40, nm52wL: 742.50 },
    { symbol: 'APOLLOTYRE', name: 'Apollo Tyres Ltd.', price: 472.50, prevClose: 461.20, finalQuantity: 112500, value: 5.30, ffmCap: 12840.50, nm52wH: 524.50, nm52wL: 398.50 },
    { symbol: 'BIOCON', name: 'Biocon Ltd.', price: 312.40, prevClose: 306.20, finalQuantity: 184200, value: 5.75, ffmCap: 10920.40, nm52wH: 350.50, nm52wL: 268.40 },
    { symbol: 'BANDHANBNK', name: 'Bandhan Bank Ltd.', price: 204.50, prevClose: 199.80, finalQuantity: 215400, value: 4.40, ffmCap: 8430.50, nm52wH: 242.40, nm52wL: 178.50 },
    { symbol: 'DLF', name: 'DLF Ltd.', price: 824.50, prevClose: 806.20, finalQuantity: 112300, value: 9.26, ffmCap: 32840.50, nm52wH: 948.50, nm52wL: 712.40 },
    { symbol: 'GLENMARK', name: 'Glenmark Pharmaceuticals Ltd.', price: 1124.50, prevClose: 1098.40, finalQuantity: 84200, value: 9.46, ffmCap: 18430.50, nm52wH: 1284.50, nm52wL: 942.50 },
    { symbol: 'METROPOLIS', name: 'Metropolis Healthcare Ltd.', price: 1824.50, prevClose: 1798.10, finalQuantity: 41200, value: 7.51, ffmCap: 12930.50, nm52wH: 2124.50, nm52wL: 1542.50 },
    { symbol: 'SUNTV', name: 'Sun TV Network Ltd.', price: 624.50, prevClose: 611.20, finalQuantity: 84200, value: 5.25, ffmCap: 11840.50, nm52wH: 724.50, nm52wL: 542.40 },
    { symbol: 'JUBLFOOD', name: 'Jubilant FoodWorks Ltd.', price: 482.40, prevClose: 471.20, finalQuantity: 212300, value: 10.20, ffmCap: 16830.40, nm52wH: 582.40, nm52wL: 412.30 },
    { symbol: 'ESCORTS', name: 'Escorts Kubota Ltd.', price: 3824.50, prevClose: 3765.30, finalQuantity: 43200, value: 16.50, ffmCap: 28430.50, nm52wH: 4250.40, nm52wL: 3120.40 },
    { symbol: 'IDEA', name: 'Vodafone Idea Ltd.', price: 15.20, prevClose: 14.80, finalQuantity: 5843200, value: 8.80, ffmCap: 24320.50, nm52wH: 18.50, nm52wL: 11.20 },
    { symbol: 'AMBUJACEM', name: 'Ambuja Cements Ltd.', price: 624.50, prevClose: 611.20, finalQuantity: 212300, value: 13.25, ffmCap: 48930.40, nm52wH: 698.40, nm52wL: 542.30 },
    { symbol: 'ACC', name: 'ACC Ltd.', price: 2482.50, prevClose: 2432.10, finalQuantity: 84200, value: 20.90, ffmCap: 38430.50, nm52wH: 2780.40, nm52wL: 2124.50 },
    { symbol: 'ADANIENT', name: 'Adani Enterprises Ltd.', price: 3212.40, prevClose: 3156.90, finalQuantity: 112300, value: 36.05, ffmCap: 128450.50, nm52wH: 3680.40, nm52wL: 2824.50 },
    { symbol: 'ADANIPORTS', name: 'Adani Ports & SEZ Ltd.', price: 1312.40, prevClose: 1289.40, finalQuantity: 212400, value: 27.80, ffmCap: 98430.60, nm52wH: 1480.40, nm52wL: 1120.50 },
    { symbol: 'AUROPHARMA', name: 'Aurobindo Pharma Ltd.', price: 1184.20, prevClose: 1162.30, finalQuantity: 112300, value: 13.30, ffmCap: 32450.60, nm52wH: 1298.50, nm52wL: 982.40 },
    { symbol: 'BALRAMCHIN', name: 'Balrampur Chini Mills Ltd.', price: 392.40, prevClose: 384.20, finalQuantity: 184200, value: 7.22, ffmCap: 11920.40, nm52wH: 450.50, nm52wL: 332.10 },
    { symbol: 'BATAINDIA', name: 'Bata India Ltd.', price: 1432.40, prevClose: 1412.10, finalQuantity: 41200, value: 5.90, ffmCap: 18430.60, nm52wH: 1682.40, nm52wL: 1324.50 },
    { symbol: 'BERGEPAINT', name: 'Berger Paints India Ltd.', price: 582.40, prevClose: 571.20, finalQuantity: 215400, value: 12.50, ffmCap: 28450.30, nm52wH: 698.40, nm52wL: 512.40 },
    { symbol: 'BHARATFORG', name: 'Bharat Forge Ltd.', price: 1224.50, prevClose: 1204.10, finalQuantity: 84200, value: 10.30, ffmCap: 38450.60, nm52wH: 1342.50, nm52wL: 984.50 },
    { symbol: 'BOSCHLTD', name: 'Bosch Ltd.', price: 28100.00, prevClose: 27850.00, finalQuantity: 4300, value: 12.08, ffmCap: 48930.50, nm52wH: 31200.00, nm52wL: 22500.00 },
    { symbol: 'CHAMBLFERT', name: 'Chambal Fertilisers & Chemicals Ltd.', price: 362.40, prevClose: 354.10, finalQuantity: 184200, value: 6.67, ffmCap: 14820.60, nm52wH: 412.40, nm52wL: 312.40 },
    { symbol: 'CHOLAFIN', name: 'Cholamandalam Investment & Finance Co.', price: 1224.50, prevClose: 1204.10, finalQuantity: 112300, value: 13.76, ffmCap: 48430.50, nm52wH: 1398.50, nm52wL: 1024.50 },
    { symbol: 'COFORGE', name: 'Coforge Ltd.', price: 5824.50, prevClose: 5742.10, finalQuantity: 21500, value: 12.52, ffmCap: 32450.60, nm52wH: 6450.40, nm52wL: 4820.50 },
    { symbol: 'CONCOR', name: 'Container Corporation of India Ltd.', price: 982.40, prevClose: 964.10, finalQuantity: 84200, value: 8.27, ffmCap: 24830.50, nm52wH: 1098.50, nm52wL: 812.40 },
    { symbol: 'COROMANDEL', name: 'Coromandel International Ltd.', price: 1184.20, prevClose: 1162.10, finalQuantity: 41200, value: 4.88, ffmCap: 18430.50, nm52wH: 1282.40, nm52wL: 982.40 },
    { symbol: 'CUMMINSIND', name: 'Cummins India Ltd.', price: 2824.50, prevClose: 2768.90, finalQuantity: 84200, value: 23.78, ffmCap: 48930.50, nm52wH: 3120.40, nm52wL: 2124.50 },
    { symbol: 'DABUR', name: 'Dabur India Ltd.', price: 582.40, prevClose: 571.20, finalQuantity: 215400, value: 12.54, ffmCap: 38450.60, nm52wH: 648.50, nm52wL: 512.40 },
    { symbol: 'DEEPAKNTR', name: 'Deepak Nitrite Ltd.', price: 2424.50, prevClose: 2398.10, finalQuantity: 84200, value: 20.41, ffmCap: 32450.60, nm52wH: 2682.40, nm52wL: 1982.40 },
    { symbol: 'DELTACORP', name: 'Delta Corp Ltd.', price: 142.40, prevClose: 139.80, finalQuantity: 432100, value: 6.15, ffmCap: 3840.50, nm52wH: 198.50, nm52wL: 124.50 },
    { symbol: 'EXIDEIND', name: 'Exide Industries Ltd.', price: 432.40, prevClose: 421.20, finalQuantity: 184300, value: 7.96, ffmCap: 18430.60, nm52wH: 498.40, nm52wL: 324.50 },
    { symbol: 'FEDERALBNK', name: 'The Federal Bank Ltd.', price: 168.40, prevClose: 164.20, finalQuantity: 624500, value: 10.51, ffmCap: 28430.50, nm52wH: 188.50, nm52wL: 132.40 },
    { symbol: 'GODREJCP', name: 'Godrej Consumer Products Ltd.', price: 1224.50, prevClose: 1204.10, finalQuantity: 84200, value: 10.30, ffmCap: 38450.60, nm52wH: 1342.50, nm52wL: 984.50 },
    { symbol: 'GODREJPROP', name: 'Godrej Properties Ltd.', price: 2482.50, prevClose: 2432.10, finalQuantity: 41200, value: 10.22, ffmCap: 28430.50, nm52wH: 2682.40, nm52wL: 1982.40 },
    { symbol: 'HAL', name: 'Hindustan Aeronautics Ltd.', price: 4282.50, prevClose: 4212.10, finalQuantity: 112300, value: 48.09, ffmCap: 128430.50, nm52wH: 4582.40, nm52wL: 3420.40 },
    { symbol: 'HAVELLS', name: 'Havells India Ltd.', price: 1582.40, prevClose: 1556.10, finalQuantity: 84200, value: 13.33, ffmCap: 48430.60, nm52wH: 1724.50, nm52wL: 1282.40 },
    { symbol: 'IBULHSGFIN', name: 'Indiabulls Housing Finance Ltd.', price: 184.20, prevClose: 179.80, finalQuantity: 412300, value: 7.59, ffmCap: 8420.50, nm52wH: 242.40, nm52wL: 142.10 },
    { symbol: 'INDHOTEL', name: 'The Indian Hotels Co. Ltd.', price: 582.40, prevClose: 571.20, finalQuantity: 215400, value: 12.54, ffmCap: 24830.50, nm52wH: 648.50, nm52wL: 512.40 },
    { symbol: 'IOC', name: 'Indian Oil Corporation Ltd.', price: 168.40, prevClose: 164.20, finalQuantity: 843200, value: 14.18, ffmCap: 38430.60, nm52wH: 198.50, nm52wL: 124.50 },
    { symbol: 'IPCALAB', name: 'IPCA Laboratories Ltd.', price: 1184.20, prevClose: 1162.10, finalQuantity: 41200, value: 4.88, ffmCap: 18430.50, nm52wH: 1282.40, nm52wL: 982.40 },
    { symbol: 'JSWENERGY', name: 'JSW Energy Ltd.', price: 582.40, prevClose: 571.20, finalQuantity: 215400, value: 12.54, ffmCap: 24830.50, nm52wH: 648.50, nm52wL: 512.40 },
    { symbol: 'L&TFH', name: 'L&T Finance Holdings Ltd.', price: 168.40, prevClose: 164.20, finalQuantity: 624500, value: 10.51, ffmCap: 28430.50, nm52wH: 188.50, nm52wL: 132.40 },
    { symbol: 'LICHSGFIN', name: 'LIC Housing Finance Ltd.', price: 682.40, prevClose: 671.20, finalQuantity: 84200, value: 5.74, ffmCap: 18430.50, nm52wH: 742.50, nm52wL: 582.40 },
    { symbol: 'LTIM', name: 'LTIMindtree Ltd.', price: 4882.50, prevClose: 4812.10, finalQuantity: 43200, value: 21.09, ffmCap: 98430.50, nm52wH: 5284.50, nm52wL: 4124.50 },
    { symbol: 'LUPIN', name: 'Lupin Ltd.', price: 1582.40, prevClose: 1556.10, finalQuantity: 84200, value: 13.33, ffmCap: 48430.60, nm52wH: 1724.50, nm52wL: 1282.40 },
    { symbol: 'MANAPPURAM', name: 'Manappuram Finance Ltd.', price: 184.20, prevClose: 179.80, finalQuantity: 412300, value: 7.59, ffmCap: 8420.50, nm52wH: 242.40, nm52wL: 142.10 },
    { symbol: 'MGL', name: 'Mahanagar Gas Ltd.', price: 1382.40, prevClose: 1356.10, finalQuantity: 84200, value: 11.64, ffmCap: 24830.50, nm52wH: 1582.40, nm52wL: 1124.50 },
    { symbol: 'MPHASIS', name: 'Mphasis Ltd.', price: 2482.50, prevClose: 2432.10, finalQuantity: 41200, value: 10.22, ffmCap: 28430.50, nm52wH: 2682.40, nm52wL: 1982.40 },
    { symbol: 'MRF', name: 'MRF Ltd.', price: 124500.00, prevClose: 123800.00, finalQuantity: 1200, value: 14.94, ffmCap: 42830.50, nm52wH: 132400.00, nm52wL: 94800.00 },
    { symbol: 'MUTHOOTFIN', name: 'Muthoot Finance Ltd.', price: 1682.40, prevClose: 1656.10, finalQuantity: 84200, value: 14.16, ffmCap: 38430.60, nm52wH: 1882.40, nm52wL: 1382.40 },
    { symbol: 'PEL', name: 'Piramal Enterprises Ltd.', price: 882.40, prevClose: 871.20, finalQuantity: 112300, value: 9.90, ffmCap: 18430.50, nm52wH: 1045.20, nm52wL: 782.40 },
    { symbol: 'PETRONET', name: 'Petronet LNG Ltd.', price: 282.40, prevClose: 276.10, finalQuantity: 212400, value: 5.99, ffmCap: 14820.60, nm52wH: 312.40, nm52wL: 232.10 },
    { symbol: 'PIDILITIND', name: 'Pidilite Industries Ltd.', price: 2882.50, prevClose: 2832.10, finalQuantity: 84200, value: 24.27, ffmCap: 84320.50, nm52wH: 3120.40, nm52wL: 2420.50 },
    { symbol: 'POLYCAB', name: 'Polycab India Ltd.', price: 6282.50, prevClose: 6189.30, finalQuantity: 43200, value: 27.14, ffmCap: 64830.40, nm52wH: 6850.40, nm52wL: 4124.50 },
    { symbol: 'POWERGRID', name: 'Power Grid Corporation of India Ltd.', price: 312.40, prevClose: 306.10, finalQuantity: 412500, value: 12.88, ffmCap: 38450.60, nm52wH: 342.40, nm52wL: 242.40 },
    { symbol: 'RAMCOCEM', name: 'The Ramco Cements Ltd.', price: 882.40, prevClose: 871.20, finalQuantity: 112300, value: 9.90, ffmCap: 18430.50, nm52wH: 1045.20, nm52wL: 782.40 },
    { symbol: 'SRF', name: 'SRF Ltd.', price: 2382.40, prevClose: 2356.10, finalQuantity: 84200, value: 20.06, ffmCap: 48430.50, nm52wH: 2682.40, nm52wL: 2124.50 },
    { symbol: 'TATACHEM', name: 'Tata Chemicals Ltd.', price: 1082.40, prevClose: 1056.10, finalQuantity: 84200, value: 9.11, ffmCap: 18430.50, nm52wH: 1284.50, nm52wL: 882.40 },
    { symbol: 'TATACOMM', name: 'Tata Communications Ltd.', price: 1882.40, prevClose: 1856.10, finalQuantity: 41200, value: 7.75, ffmCap: 24830.50, nm52wH: 2124.50, nm52wL: 1682.40 },
    { symbol: 'TCSC', name: 'TCS Group Ltd.', price: 3824.50, prevClose: 3768.90, finalQuantity: 112400, value: 42.90, ffmCap: 198420.50, nm52wH: 4250.40, nm52wL: 3420.50 },
    { symbol: 'TECHM', name: 'Tech Mahindra Ltd.', price: 1382.40, prevClose: 1356.10, finalQuantity: 84200, value: 11.64, ffmCap: 24830.50, nm52wH: 1582.40, nm52wL: 1124.50 },
    { symbol: 'TRENT', name: 'Trent Ltd.', price: 4582.40, prevClose: 4512.60, finalQuantity: 43200, value: 19.80, ffmCap: 78430.50, nm52wH: 4982.50, nm52wL: 3824.10 },
    { symbol: 'TVSTRUCT', name: 'TVS Motor Company Ltd.', price: 2182.40, prevClose: 2156.10, finalQuantity: 84200, value: 18.37, ffmCap: 48430.50, nm52wH: 2482.40, nm52wL: 1824.50 },
    { symbol: 'UBL', name: 'United Breweries Ltd.', price: 1882.40, prevClose: 1856.10, finalQuantity: 41200, value: 7.75, ffmCap: 24830.50, nm52wH: 2124.50, nm52wL: 1682.40 },
    { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Ltd.', price: 9882.50, prevClose: 9789.30, finalQuantity: 12400, value: 12.25, ffmCap: 68430.50, nm52wH: 11200.40, nm52wL: 8200.50 },
    { symbol: 'VOLTAS', name: 'Voltas Ltd.', price: 1282.40, prevClose: 1256.10, finalQuantity: 84200, value: 10.79, ffmCap: 24830.50, nm52wH: 1482.40, nm52wL: 1082.40 },
    { symbol: 'WHIRLPOOL', name: 'Whirlpool of India Ltd.', price: 1582.40, prevClose: 1556.10, finalQuantity: 41200, value: 6.52, ffmCap: 18430.50, nm52wH: 1724.50, nm52wL: 1284.50 },
  ];

  const generated: StockQuote[] = [];

  fnoStocks.forEach(s => {
    const pctChange = parseFloat((((s.price - s.prevClose) / s.prevClose) * 100).toFixed(2));
    const change = parseFloat((s.price - s.prevClose).toFixed(2));
    
    generated.push({
      symbol: s.symbol,
      name: s.name,
      ltp: s.price,
      open: s.price,
      high: Math.max(s.price, s.prevClose) * 1.002,
      low: Math.min(s.price, s.prevClose) * 0.998,
      prevClose: s.prevClose,
      volume: s.finalQuantity,
      change,
      changePercent: pctChange,
      // IEP columns
      iep: s.price,
      final: s.price,
      finalQuantity: s.finalQuantity,
      value: s.value,
      ffmCap: s.ffmCap,
      nm52wH: s.nm52wH,
      nm52wL: s.nm52wL
    });
  });

  return generated;
};

const INITIAL_STOCKS: StockQuote[] = generateFnOSecurities();

const INSTRUMENT_TO_SYMBOL: { [key: number]: string } = {
  341249: 'ASHOKLEY',
  3814401: 'HINDPETRO',
  897537: 'TATASTEEL',
  784129: 'VEDL',
  5633: 'HINDZINC',
  341201: 'RVNL',
  232961: 'YESBANK',
  857857: 'MOTILALOFS',
  340097: 'PNB',
  10763: 'CANBK',
  34057: 'ZEEL',
  10762: 'GMRINFRA',
  10761: 'SAIL',
  341233: 'NATIONALUM',
  341235: 'NMDC',
  878577: 'TATAPOWER',
  897539: 'PFC',
  897541: 'RECLTD',
  897543: 'BHEL',
  897545: 'GAIL',
  897547: 'ONGC',
  897549: 'COALINDIA',
  897551: 'BEL',
  897553: 'WIPRO',
  340101: 'HDFCBANK',
  1270503: 'ICICIBANK',
  340103: 'SBIN',
  738561: 'RELIANCE',
  340105: 'TCS',
  340107: 'INFY',
  340109: 'AXISBANK',
  340111: 'KOTAKBANK',
  340113: 'TATAMOTORS',
  340115: 'BAJFINANCE',
  340117: 'BHARTIARTL',
  340119: 'ITC',
  340121: 'HINDUNILVR',
  340123: 'LT',
  340125: 'SUNPHARMA',
  340127: 'NTPC',
  340129: 'MARUTI',
  340131: 'JSWSTEEL',
  340133: 'APOLLOTYRE',
  340135: 'BIOCON',
  340137: 'BANDHANBNK',
  340139: 'DLF',
  340141: 'GLENMARK',
  340143: 'METROPOLIS',
  340145: 'SUNTV',
  340147: 'JUBLFOOD',
  340149: 'ESCORTS',
  340151: 'IDEA',
  340153: 'AMBUJACEM',
  340155: 'ACC',
  340157: 'ADANIENT',
  340159: 'ADANIPORTS',
  340161: 'AUROPHARMA',
  340163: 'BALRAMCHIN',
  340165: 'BATAINDIA',
  340167: 'BERGEPAINT',
  340169: 'BHARATFORG',
  340171: 'BOSCHLTD',
  340173: 'CHAMBLFERT',
  340175: 'CHOLAFIN',
  340177: 'COFORGE',
  340179: 'CONCOR',
  340181: 'COROMANDEL',
  340183: 'CUMMINSIND',
  340185: 'DABUR',
  340187: 'DEEPAKNTR',
  340189: 'DELTACORP',
  340191: 'EXIDEIND',
  340193: 'FEDERALBNK',
  340195: 'GODREJCP',
  340197: 'GODREJPROP',
  340199: 'HAL',
  340201: 'HAVELLS',
  340203: 'IBULHSGFIN',
  340205: 'INDHOTEL',
  340207: 'IOC',
  340209: 'IPCALAB',
  340211: 'JSWENERGY',
  340213: 'L&TFH',
  340215: 'LICHSGFIN',
  340217: 'LTIM',
  340219: 'LUPIN',
  340221: 'MANAPPURAM',
  340223: 'MGL',
  340225: 'MPHASIS',
  340227: 'MRF',
  340229: 'MUTHOOTFIN',
  340231: 'PEL',
  340233: 'PETRONET',
  340235: 'PIDILITIND',
  340237: 'POLYCAB',
  340239: 'POWERGRID',
  340241: 'RAMCOCEM',
  340243: 'SRF',
  340245: 'TATACHEM',
  340247: 'TATACOMM',
  340249: 'TCSC',
  340251: 'TECHM',
  340253: 'TRENT',
  340255: 'TVSTRUCT',
  340257: 'UBL',
  340259: 'ULTRACEMCO',
  340261: 'VOLTAS',
  340263: 'WHIRLPOOL'
};

class AlgoEngineService {
  private stocksState: StockQuote[] = [...INITIAL_STOCKS];
  private intervalId: NodeJS.Timeout | null = null;
  private isTradingActive: boolean = false;
  private ws: WebSocket | null = null;
  private lastUpdate: { [symbol: string]: number } = {};

  constructor() {
    this.startSimulation();
    this.initializeKiteLiveFeed();
  }

  // Initialize Kite Live Socket feed from Environment variables or Database
  public async initializeKiteLiveFeed() {
    try {
      // 1. Try env variables first
      const envApiKey = process.env.ZERODHA_API_KEY || process.env.KITE_API_KEY;
      const envAccessToken = process.env.ZERODHA_ACCESS_TOKEN || process.env.KITE_ACCESS_TOKEN;

      if (envApiKey && envAccessToken) {
        console.log('Using master Zerodha credentials configured in .env variables');
        this.connectKiteWebSocket(envApiKey, envAccessToken);
        return;
      }

      // 2. Fall back to Client credentials inside DB
      const client = await prisma.client.findFirst({
        where: {
          accessToken: { not: null },
          zerodhaApiKey: { not: null }
        }
      });

      if (client && client.zerodhaApiKey && client.accessToken) {
        console.log(`Using database configuration for Client: ${client.zerodhaClientId}`);
        this.connectKiteWebSocket(client.zerodhaApiKey, client.accessToken);
      } else {
        console.log('No Zerodha details found in .env or database. Running simulated fallback ticker.');
      }
    } catch (err) {
      console.error('Failed to configure Kite Connect socket feed:', err);
    }
  }

  // Establish connection to Zerodha's wss streaming gateway
  private connectKiteWebSocket(apiKey: string, accessToken: string) {
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
    }

    const wsUrl = `wss://ws.kite.trade?api_key=${apiKey}&access_token=${accessToken}`;
    console.log(`Connecting to Kite streaming endpoint...`);
    this.ws = new WebSocket(wsUrl);

    this.ws.on('open', () => {
      console.log('Kite WebSocket connection established.');
      // Subscribe to all mapped instruments
      const tokens = Object.keys(INSTRUMENT_TO_SYMBOL).map(Number);
      
      const subMsg = {
        a: 'subscribe',
        v: tokens
      };
      this.ws?.send(JSON.stringify(subMsg));

      const modeMsg = {
        a: 'mode',
        v: ['quote', tokens]
      };
      this.ws?.send(JSON.stringify(modeMsg));
    });

    this.ws.on('message', (data: any) => {
      if (Buffer.isBuffer(data)) {
        this.parseKiteBinaryPacket(data);
      }
    });

    this.ws.on('error', (err: any) => {
      console.error('Kite Socket error:', err);
    });

    this.ws.on('close', () => {
      console.log('Kite Socket disconnected. Reconnecting in 5 seconds...');
      setTimeout(() => {
        this.connectKiteWebSocket(apiKey, accessToken);
      }, 5000);
    });
  }

  // Parse standard 44-byte quote ticking package
  private parseKiteBinaryPacket(buffer: Buffer) {
    if (buffer.length < 4) return;
    try {
      const count = buffer.readUInt16BE(0);
      let offset = 2;

      for (let i = 0; i < count; i++) {
        if (offset + 2 > buffer.length) break;
        const packetLength = buffer.readUInt16BE(offset);
        offset += 2;

        if (offset + packetLength > buffer.length) break;

        if (packetLength === 44 || packetLength === 184) {
          const token = buffer.readUInt32BE(offset);
          const symbol = INSTRUMENT_TO_SYMBOL[token];
          if (symbol) {
            const ltp = buffer.readUInt32BE(offset + 4) / 100;
            const volume = buffer.readUInt32BE(offset + 16);
            const open = buffer.readUInt32BE(offset + 28) / 100;
            const high = buffer.readUInt32BE(offset + 32) / 100;
            const low = buffer.readUInt32BE(offset + 36) / 100;
            const close = buffer.readUInt32BE(offset + 40) / 100;

            this.updateStockFromTick(symbol, ltp, open, high, low, close, volume);
          }
        } else if (packetLength === 8) {
          const token = buffer.readUInt32BE(offset);
          const symbol = INSTRUMENT_TO_SYMBOL[token];
          if (symbol) {
            const ltp = buffer.readUInt32BE(offset + 4) / 100;
            this.updateStockLtp(symbol, ltp);
          }
        }
        offset += packetLength;
      }
    } catch (e) {
      console.error('Kite packet parsing error:', e);
    }
  }

  private updateStockFromTick(symbol: string, ltp: number, open: number, high: number, low: number, close: number, volume: number) {
    this.lastUpdate[symbol] = Date.now();
    this.stocksState = this.stocksState.map(stock => {
      if (stock.symbol === symbol) {
        const change = parseFloat((ltp - close).toFixed(2));
        const changePercent = parseFloat(((change / close) * 100).toFixed(2));
        return {
          ...stock,
          ltp,
          open,
          high,
          low,
          prevClose: close,
          volume: volume || stock.volume,
          change,
          changePercent,
          iep: ltp,
          final: ltp,
          finalQuantity: volume || stock.finalQuantity
        };
      }
      return stock;
    });
  }

  private updateStockLtp(symbol: string, ltp: number) {
    this.lastUpdate[symbol] = Date.now();
    this.stocksState = this.stocksState.map(stock => {
      if (stock.symbol === symbol) {
        const change = parseFloat((ltp - stock.prevClose).toFixed(2));
        const changePercent = parseFloat(((change / stock.prevClose) * 100).toFixed(2));
        return {
          ...stock,
          ltp,
          change,
          changePercent,
          iep: ltp,
          final: ltp
        };
      }
      return stock;
    });
  }

  // Fallback simulator for symbols not recently updated via WebSocket
  private startSimulation() {
    if (this.intervalId) return;

    this.intervalId = setInterval(async () => {
      const now = Date.now();
      this.stocksState = this.stocksState.map(stock => {
        // Skip simulation if the stock was updated via WebSocket in the last 10 seconds
        if (this.lastUpdate[stock.symbol] && (now - this.lastUpdate[stock.symbol] < 10000)) {
          return stock;
        }

        const pctChange = (Math.random() - 0.5) * 0.002;
        const newLtp = parseFloat((stock.ltp * (1 + pctChange)).toFixed(2));
        
        const newHigh = newLtp > stock.high ? newLtp : stock.high;
        const newLow = newLtp < stock.low ? newLtp : stock.low;
        const change = parseFloat((newLtp - stock.prevClose).toFixed(2));
        const changePercent = parseFloat(((change / stock.prevClose) * 100).toFixed(2));

        return {
          ...stock,
          ltp: newLtp,
          high: newHigh,
          low: newLow,
          change,
          changePercent,
          iep: newLtp,
          final: newLtp,
          volume: stock.volume + Math.floor(Math.random() * 20),
          finalQuantity: stock.finalQuantity + Math.floor(Math.random() * 20)
        };
      });

      if (this.isTradingActive) {
        await this.monitorTrades();
      }
    }, 3000);
  }

  public getStocks(): StockQuote[] {
    return this.stocksState;
  }

  public toggleTrading(status: boolean) {
    this.isTradingActive = status;
  }

  public getTradingStatus(): boolean {
    return this.isTradingActive;
  }

  // Scanner picks Top Losers for strategy selection
  public getScannerResults(): StockQuote[] {
    return [...this.stocksState]
      .sort((a, b) => a.changePercent - b.changePercent);
  }

  // Core execution: Runs Pre-Open scan and initiates trades
  public async executePreOpenTrades(adminId: string) {
    const losers = this.getScannerResults();
    if (losers.length === 0) return;

    const targetStock = losers[0];

    const candleHigh = targetStock.high;

    const entryPrice = parseFloat((candleHigh * 1.001).toFixed(2));
    const stopLoss = parseFloat((entryPrice * 0.995).toFixed(2));
    const target = parseFloat((entryPrice * 1.015).toFixed(2));

    const clients = await prisma.client.findMany({
      where: {
        tradingStatus: 'active',
        subscriptionStatus: 'active',
      },
      include: {
        user: true,
      },
    });

    for (const client of clients) {
      const capital = Number(client.capital);
      const riskAmount = capital * 0.01;
      const perShareRisk = entryPrice - stopLoss;
      const quantity = Math.floor(riskAmount / perShareRisk);

      if (quantity <= 0) continue;

      await prisma.trade.create({
        data: {
          clientId: client.id,
          strategyId: client.strategyId || 'pre-open-breakout',
          symbol: targetStock.symbol,
          orderType: 'MIS',
          entryPrice: entryPrice,
          quantity: quantity,
          stopLoss: stopLoss,
          target: target,
          status: 'open',
          entryTime: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          adminId,
          action: `AUTO_TRADE_EXECUTION: Order placed for ${client.user.name} - ${quantity} shares of ${targetStock.symbol}`,
        },
      });
    }
  }

  // Monitor live orders to execute Target / SL
  private async monitorTrades() {
    const activeTrades = await prisma.trade.findMany({
      where: { status: 'open' },
    });

    for (const trade of activeTrades) {
      const currentQuote = this.stocksState.find(s => s.symbol === trade.symbol);
      if (!currentQuote) continue;

      const entry = Number(trade.entryPrice);
      const sl = Number(trade.stopLoss);
      const target = Number(trade.target);
      const qty = trade.quantity;
      const currentPrice = currentQuote.ltp;

      let status = 'open';
      let exitPrice = null;
      let pnl = null;

      if (currentPrice >= target) {
        status = 'closed';
        exitPrice = target;
        pnl = (target - entry) * qty;
      } else if (currentPrice <= sl) {
        status = 'closed';
        exitPrice = sl;
        pnl = (sl - entry) * qty;
      }

      if (status === 'closed' && exitPrice !== null) {
        await prisma.trade.update({
          where: { id: trade.id },
          data: {
            status,
            exitPrice,
            pnl,
            exitTime: new Date(),
          },
        });
      }
    }
  }
}

const globalForAlgo = global as unknown as { algoEngine: AlgoEngineService };
export const algoEngine = globalForAlgo.algoEngine || new AlgoEngineService();
if (process.env.NODE_ENV !== 'production') globalForAlgo.algoEngine = algoEngine;
