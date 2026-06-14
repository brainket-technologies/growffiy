import { prisma } from '../lib/db';

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
}

// Helper to generate F&O Securities
const generateFnOSecurities = (): StockQuote[] => {
  const fnoStocks = [
    { symbol: 'ASHOKLEY', name: 'Ashok Leyland Ltd.', price: 143.22, prevClose: 138.58 },
    { symbol: 'HINDPETRO', name: 'Hindustan Petroleum Corp. Ltd.', price: 377.70, prevClose: 365.70 },
    { symbol: 'TATASTEEL', name: 'Tata Steel Ltd.', price: 200.00, prevClose: 197.96 },
    { symbol: 'VEDL', name: 'Vedanta Limited', price: 314.00, prevClose: 304.90 },
    { symbol: 'HINDZINC', name: 'Hindustan Zinc Ltd.', price: 560.95, prevClose: 545.00 },
    { symbol: 'RVNL', name: 'Rail Vikas Nigam Ltd.', price: 228.50, prevClose: 222.19 },
    { symbol: 'YESBANK', name: 'Yes Bank Ltd.', price: 22.85, prevClose: 22.22 },
    { symbol: 'MOTILALOFS', name: 'Motilal Oswal Financial Services Ltd.', price: 854.70, prevClose: 831.60 },
    { symbol: 'PNB', name: 'Punjab National Bank', price: 124.50, prevClose: 121.20 },
    { symbol: 'CANBK', name: 'Canara Bank', price: 118.90, prevClose: 115.30 },
    { symbol: 'ZEEL', name: 'Zee Entertainment Enterprises Ltd.', price: 154.20, prevClose: 151.10 },
    { symbol: 'GMRINFRA', name: 'GMR Airports Infrastructure Ltd.', price: 88.50, prevClose: 86.40 },
    { symbol: 'SAIL', name: 'Steel Authority of India Ltd.', price: 148.90, prevClose: 145.20 },
    { symbol: 'NATIONALUM', name: 'National Aluminium Co. Ltd.', price: 179.80, prevClose: 184.20 },
    { symbol: 'NMDC', name: 'NMDC Limited', price: 232.40, prevClose: 227.10 },
    { symbol: 'TATAPOWER', name: 'Tata Power Co. Ltd.', price: 432.10, prevClose: 421.40 },
    { symbol: 'PFC', name: 'Power Finance Corporation Ltd.', price: 482.50, prevClose: 471.20 },
    { symbol: 'RECLTD', name: 'REC Limited', price: 512.40, prevClose: 498.90 },
    { symbol: 'BHEL', name: 'Bharat Heavy Electricals Ltd.', price: 284.10, prevClose: 276.50 },
    { symbol: 'GAIL', name: 'GAIL (India) Ltd.', price: 212.30, prevClose: 206.90 },
    { symbol: 'ONGC', name: 'Oil & Natural Gas Corporation Ltd.', price: 268.40, prevClose: 261.20 },
    { symbol: 'COALINDIA', name: 'Coal India Ltd.', price: 472.50, prevClose: 459.80 },
    { symbol: 'BEL', name: 'Bharat Electronics Ltd.', price: 292.10, prevClose: 284.60 },
    { symbol: 'WIPRO', name: 'Wipro Ltd.', price: 462.40, prevClose: 452.10 },
    { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', price: 1582.42, prevClose: 1618.00 },
    { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', price: 1112.50, prevClose: 1098.40 },
    { symbol: 'SBIN', name: 'State Bank of India', price: 828.50, prevClose: 814.90 },
    { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', price: 2912.40, prevClose: 2875.00 },
    { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.', price: 3824.50, prevClose: 3768.90 },
    { symbol: 'INFY', name: 'Infosys Ltd.', price: 1482.40, prevClose: 1456.20 },
    { symbol: 'AXISBANK', name: 'Axis Bank Ltd.', price: 1184.20, prevClose: 1162.30 },
    { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd.', price: 1724.50, prevClose: 1698.40 },
    { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd.', price: 962.40, prevClose: 945.10 },
    { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd.', price: 6982.50, prevClose: 6875.00 },
    { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd.', price: 1384.20, prevClose: 1356.40 },
    { symbol: 'ITC', name: 'ITC Ltd.', price: 432.40, prevClose: 424.10 },
    { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd.', price: 2482.50, prevClose: 2452.10 },
    { symbol: 'LT', name: 'Larsen & Toubro Ltd.', price: 3582.40, prevClose: 3512.60 },
    { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries Ltd.', price: 1512.40, prevClose: 1489.20 },
    { symbol: 'NTPC', name: 'NTPC Ltd.', price: 362.40, prevClose: 354.10 },
    { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd.', price: 12100.00, prevClose: 11950.00 },
    { symbol: 'JSWSTEEL', name: 'JSW Steel Ltd.', price: 892.40, prevClose: 876.10 },
    { symbol: 'APOLLOTYRE', name: 'Apollo Tyres Ltd.', price: 472.50, prevClose: 461.20 },
    { symbol: 'BIOCON', name: 'Biocon Ltd.', price: 312.40, prevClose: 306.20 },
    { symbol: 'BANDHANBNK', name: 'Bandhan Bank Ltd.', price: 204.50, prevClose: 199.80 },
    { symbol: 'DLF', name: 'DLF Ltd.', price: 824.50, prevClose: 806.20 },
    { symbol: 'GLENMARK', name: 'Glenmark Pharmaceuticals Ltd.', price: 1124.50, prevClose: 1098.40 },
    { symbol: 'METROPOLIS', name: 'Metropolis Healthcare Ltd.', price: 1824.50, prevClose: 1798.10 },
    { symbol: 'SUNTV', name: 'Sun TV Network Ltd.', price: 624.50, prevClose: 611.20 },
    { symbol: 'JUBLFOOD', name: 'Jubilant FoodWorks Ltd.', price: 482.40, prevClose: 471.20 },
    { symbol: 'ESCORTS', name: 'Escorts Kubota Ltd.', price: 3824.50, prevClose: 3765.30 },
    { symbol: 'IDEA', name: 'Vodafone Idea Ltd.', price: 15.20, prevClose: 14.80 },
    { symbol: 'AMBUJACEM', name: 'Ambuja Cements Ltd.', price: 624.50, prevClose: 611.20 },
    { symbol: 'ACC', name: 'ACC Ltd.', price: 2482.50, prevClose: 2432.10 },
    { symbol: 'ADANIENT', name: 'Adani Enterprises Ltd.', price: 3212.40, prevClose: 3156.90 },
    { symbol: 'ADANIPORTS', name: 'Adani Ports & SEZ Ltd.', price: 1312.40, prevClose: 1289.40 },
    { symbol: 'AUROPHARMA', name: 'Aurobindo Pharma Ltd.', price: 1184.20, prevClose: 1162.30 },
    { symbol: 'BALRAMCHIN', name: 'Balrampur Chini Mills Ltd.', price: 392.40, prevClose: 384.20 },
    { symbol: 'BATAINDIA', name: 'Bata India Ltd.', price: 1432.40, prevClose: 1412.10 },
    { symbol: 'BERGEPAINT', name: 'Berger Paints India Ltd.', price: 582.40, prevClose: 571.20 },
    { symbol: 'BHARATFORG', name: 'Bharat Forge Ltd.', price: 1224.50, prevClose: 1204.10 },
    { symbol: 'BOSCHLTD', name: 'Bosch Ltd.', price: 28100.00, prevClose: 27850.00 },
    { symbol: 'CHAMBLFERT', name: 'Chambal Fertilisers & Chemicals Ltd.', price: 362.40, prevClose: 354.10 },
    { symbol: 'CHOLAFIN', name: 'Cholamandalam Investment & Finance Co.', price: 1224.50, prevClose: 1204.10 },
    { symbol: 'COFORGE', name: 'Coforge Ltd.', price: 5824.50, prevClose: 5742.10 },
    { symbol: 'CONCOR', name: 'Container Corporation of India Ltd.', price: 982.40, prevClose: 964.10 },
    { symbol: 'COROMANDEL', name: 'Coromandel International Ltd.', price: 1184.20, prevClose: 1162.10 },
    { symbol: 'CUMMINSIND', name: 'Cummins India Ltd.', price: 2824.50, prevClose: 2768.90 },
    { symbol: 'DABUR', name: 'Dabur India Ltd.', price: 582.40, prevClose: 571.20 },
    { symbol: 'DEEPAKNTR', name: 'Deepak Nitrite Ltd.', price: 2424.50, prevClose: 2398.10 },
    { symbol: 'DELTACORP', name: 'Delta Corp Ltd.', price: 142.40, prevClose: 139.80 },
    { symbol: 'EXIDEIND', name: 'Exide Industries Ltd.', price: 432.40, prevClose: 421.20 },
    { symbol: 'FEDERALBNK', name: 'The Federal Bank Ltd.', price: 168.40, prevClose: 164.20 },
    { symbol: 'GODREJCP', name: 'Godrej Consumer Products Ltd.', price: 1224.50, prevClose: 1204.10 },
    { symbol: 'GODREJPROP', name: 'Godrej Properties Ltd.', price: 2482.50, prevClose: 2432.10 },
    { symbol: 'HAL', name: 'Hindustan Aeronautics Ltd.', price: 4282.50, prevClose: 4212.10 },
    { symbol: 'HAVELLS', name: 'Havells India Ltd.', price: 1582.40, prevClose: 1556.10 },
    { symbol: 'IBULHSGFIN', name: 'Indiabulls Housing Finance Ltd.', price: 184.20, prevClose: 179.80 },
    { symbol: 'INDHOTEL', name: 'The Indian Hotels Co. Ltd.', price: 582.40, prevClose: 571.20 },
    { symbol: 'IOC', name: 'Indian Oil Corporation Ltd.', price: 168.40, prevClose: 164.20 },
    { symbol: 'IPCALAB', name: 'IPCA Laboratories Ltd.', price: 1184.20, prevClose: 1162.10 },
    { symbol: 'JSWENERGY', name: 'JSW Energy Ltd.', price: 582.40, prevClose: 571.20 },
    { symbol: 'L&TFH', name: 'L&T Finance Holdings Ltd.', price: 168.40, prevClose: 164.20 },
    { symbol: 'LICHSGFIN', name: 'LIC Housing Finance Ltd.', price: 682.40, prevClose: 671.20 },
    { symbol: 'LTIM', name: 'LTIMindtree Ltd.', price: 4882.50, prevClose: 4812.10 },
    { symbol: 'LUPIN', name: 'Lupin Ltd.', price: 1582.40, prevClose: 1556.10 },
    { symbol: 'MANAPPURAM', name: 'Manappuram Finance Ltd.', price: 184.20, prevClose: 179.80 },
    { symbol: 'MGL', name: 'Mahanagar Gas Ltd.', price: 1382.40, prevClose: 1356.10 },
    { symbol: 'MPHASIS', name: 'Mphasis Ltd.', price: 2482.50, prevClose: 2432.10 },
    { symbol: 'MRF', name: 'MRF Ltd.', price: 124500.00, prevClose: 123800.00 },
    { symbol: 'MUTHOOTFIN', name: 'Muthoot Finance Ltd.', price: 1682.40, prevClose: 1656.10 },
    { symbol: 'PEL', name: 'Piramal Enterprises Ltd.', price: 882.40, prevClose: 871.20 },
    { symbol: 'PETRONET', name: 'Petronet LNG Ltd.', price: 282.40, prevClose: 276.10 },
    { symbol: 'PIDILITIND', name: 'Pidilite Industries Ltd.', price: 2882.50, prevClose: 2832.10 },
    { symbol: 'POLYCAB', name: 'Polycab India Ltd.', price: 6282.50, prevClose: 6189.30 },
    { symbol: 'POWERGRID', name: 'Power Grid Corporation of India Ltd.', price: 312.40, prevClose: 306.10 },
    { symbol: 'RAMCOCEM', name: 'The Ramco Cements Ltd.', price: 882.40, prevClose: 871.20 },
    { symbol: 'SRF', name: 'SRF Ltd.', price: 2382.40, prevClose: 2356.10 },
    { symbol: 'TATACHEM', name: 'Tata Chemicals Ltd.', price: 1082.40, prevClose: 1056.10 },
    { symbol: 'TATACOMM', name: 'Tata Communications Ltd.', price: 1882.40, prevClose: 1856.10 },
    { symbol: 'TECHM', name: 'Tech Mahindra Ltd.', price: 1382.40, prevClose: 1356.10 },
    { symbol: 'TRENT', name: 'Trent Ltd.', price: 4582.40, prevClose: 4512.60 },
    { symbol: 'TVSTRUCT', name: 'TVS Motor Company Ltd.', price: 2182.40, prevClose: 2156.10 },
    { symbol: 'UBL', name: 'United Breweries Ltd.', price: 1882.40, prevClose: 1856.10 },
    { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Ltd.', price: 9882.50, prevClose: 9789.30 },
    { symbol: 'VOLTAS', name: 'Voltas Ltd.', price: 1282.40, prevClose: 1256.10 },
    { symbol: 'WHIRLPOOL', name: 'Whirlpool of India Ltd.', price: 1582.40, prevClose: 1556.10 },
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
      volume: Math.floor(Math.random() * 5000000) + 100000,
      change,
      changePercent: pctChange
    });
  });

  return generated;
};

const INITIAL_STOCKS: StockQuote[] = generateFnOSecurities();

class AlgoEngineService {
  private stocksState: StockQuote[] = [...INITIAL_STOCKS];
  private intervalId: NodeJS.Timeout | null = null;
  private isTradingActive: boolean = false;

  constructor() {
    this.startSimulation();
  }

  // Starts real-time market stock ticker simulation
  private startSimulation() {
    if (this.intervalId) return;

    this.intervalId = setInterval(async () => {
      this.stocksState = this.stocksState.map(stock => {
        // Random price movement (-0.2% to +0.2%)
        const pctChange = (Math.random() - 0.5) * 0.004;
        const newLtp = parseFloat((stock.ltp * (1 + pctChange)).toFixed(2));
        
        // Update high/low
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
          volume: stock.volume + Math.floor(Math.random() * 500),
        };
      });

      // If trading engine is active, check/update live simulated orders
      if (this.isTradingActive) {
        await this.monitorTrades();
      }
    }, 2000);
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
      .sort((a, b) => a.changePercent - b.changePercent); // Sorted by top losers
  }

  // Core execution: Runs Pre-Open scan and initiates trades
  public async executePreOpenTrades(adminId: string) {
    const losers = this.getScannerResults();
    if (losers.length === 0) return;

    const targetStock = losers[0]; // Scanner identifies top loser stock

    // 5-Min Candle High Calculation (mocking with current High)
    const candleHigh = targetStock.high;

    // Entry Logic
    const entryPrice = parseFloat((candleHigh * 1.001).toFixed(2)); // High + 0.1% buffer
    const stopLoss = parseFloat((entryPrice * 0.995).toFixed(2)); // Entry - 0.5%
    const target = parseFloat((entryPrice * 1.015).toFixed(2)); // Entry + 1.5%

    // Fetch active subscribed clients
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
      const riskAmount = capital * 0.01; // 1% Risk
      const perShareRisk = entryPrice - stopLoss;
      const quantity = Math.floor(riskAmount / perShareRisk);

      if (quantity <= 0) continue;

      // Create simulated trade in DB
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

      // Audit Log
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

// Global singleton for Next.js hot-reloads
const globalForAlgo = global as unknown as { algoEngine: AlgoEngineService };
export const algoEngine = globalForAlgo.algoEngine || new AlgoEngineService();
if (process.env.NODE_ENV !== 'production') globalForAlgo.algoEngine = algoEngine;
