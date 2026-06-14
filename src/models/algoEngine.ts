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

// Initial mock stock data for Nifty 200 simulation
// Helper to generate 200 Nifty stocks
const generateNifty200 = (): StockQuote[] => {
  const baseStocks = [
    { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', price: 2450 },
    { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.', price: 3210 },
    { symbol: 'INFY', name: 'Infosys Limited', price: 1420 },
    { symbol: 'HDFCBANK', name: 'HDFC Bank Limited', price: 1610 },
    { symbol: 'ICICIBANK', name: 'ICICI Bank Limited', price: 935 },
    { symbol: 'SBIN', name: 'State Bank of India', price: 572 },
    { symbol: 'WIPRO', name: 'Wipro Limited', price: 412 },
    { symbol: 'TATAMOTORS', name: 'Tata Motors Limited', price: 620 },
    { symbol: 'ADANIENT', name: 'Adani Enterprises Ltd.', price: 2410 },
    { symbol: 'ADANIPORTS', name: 'Adani Ports & SEZ Ltd.', price: 785 },
    { symbol: 'ITC', name: 'ITC Limited', price: 440 },
    { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd.', price: 890 },
    { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd.', price: 2520 },
    { symbol: 'LT', name: 'Larsen & Toubro Ltd.', price: 2650 },
    { symbol: 'AXISBANK', name: 'Axis Bank Ltd.', price: 960 },
    { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd.', price: 1820 },
    { symbol: 'M&M', name: 'Mahindra & Mahindra Ltd.', price: 1540 },
    { symbol: 'TITAN', name: 'Titan Company Ltd.', price: 2980 },
    { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Ltd.', price: 8200 },
    { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries Ltd.', price: 1120 },
    { symbol: 'NTPC', name: 'NTPC Limited', price: 220 },
    { symbol: 'TATASTEEL', name: 'Tata Steel Limited', price: 115 },
    { symbol: 'POWERGRID', name: 'Power Grid Corporation of India Ltd.', price: 245 },
    { symbol: 'NESTLEIND', name: 'Nestle India Ltd.', price: 22500 },
    { symbol: 'COALINDIA', name: 'Coal India Ltd.', price: 230 },
    { symbol: 'ONGC', name: 'Oil & Natural Gas Corporation Ltd.', price: 180 },
    { symbol: 'ADANIPOWER', name: 'Adani Power Ltd.', price: 350 },
    { symbol: 'JSWSTEEL', name: 'JSW Steel Ltd.', price: 780 },
    { symbol: 'HINDALCO', name: 'Hindalco Industries Ltd.', price: 460 },
    { symbol: 'GRASIM', name: 'Grasim Industries Ltd.', price: 1810 },
    { symbol: 'HCLTECH', name: 'HCL Technologies Ltd.', price: 1160 },
    { symbol: 'INDUSINDBK', name: 'IndusInd Bank Ltd.', price: 1390 },
    { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto Ltd.', price: 4700 },
    { symbol: 'DIVISLAB', name: 'Divi\'s Laboratories Ltd.', price: 3650 },
    { symbol: 'BPCL', name: 'Bharat Petroleum Corporation Ltd.', price: 360 },
    { symbol: 'CIPLA', name: 'Cipla Limited', price: 1020 },
    { symbol: 'EICHERMOT', name: 'Eicher Motors Ltd.', price: 3300 },
    { symbol: 'DRREDDY', name: 'Dr. Reddy\'s Laboratories Ltd.', price: 5200 },
    { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals Enterprise Ltd.', price: 4900 },
    { symbol: 'BRITANNIA', name: 'Britannia Industries Ltd.', price: 4500 },
    { symbol: 'SHRIRAMFIN', name: 'Shriram Finance Ltd.', price: 1750 },
    { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp Ltd.', price: 2900 },
    { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd.', price: 9500 },
    { symbol: 'TECHM', name: 'Tech Mahindra Ltd.', price: 1100 },
    { symbol: 'UPL', name: 'UPL Limited', price: 580 },
    { symbol: 'TATACONSUM', name: 'Tata Consumer Products Ltd.', price: 840 },
    { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd.', price: 7100 },
    { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv Ltd.', price: 1520 },
    { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd.', price: 3200 },
  ];
  
  const generated: StockQuote[] = [];
  
  baseStocks.forEach(s => {
    const changePercent = parseFloat(((Math.random() - 0.5) * 4).toFixed(2));
    const change = parseFloat(((s.price * changePercent) / 100).toFixed(2));
    const open = parseFloat((s.price * (1 - (Math.random() - 0.5) * 0.01)).toFixed(2));
    const prevClose = parseFloat((s.price).toFixed(2));
    
    generated.push({
      symbol: s.symbol,
      name: s.name,
      ltp: s.price,
      open,
      high: Math.max(s.price, open) * 1.01,
      low: Math.min(s.price, open) * 0.99,
      prevClose,
      volume: Math.floor(Math.random() * 5000000) + 100000,
      change,
      changePercent
    });
  });
  
  const sectors = ['CHEM', 'PHARMA', 'INFRA', 'POWER', 'STEEL', 'BANK', 'AUTO', 'FOOD', 'TECH', 'FIN'];
  const groups = ['TATA', 'BIRLA', 'ADANI', 'RELIANCE', 'JINDAL', 'MAHINDRA', 'BAJAJ', 'GODREJ', 'HDFC', 'ICICI'];
  
  let index = 0;
  while (generated.length < 200) {
    const group = groups[index % groups.length];
    const sector = sectors[Math.floor(Math.random() * sectors.length)];
    const id = 100 + index;
    const symbol = `${group}-${sector}${id}`;
    
    if (generated.some(s => s.symbol === symbol)) {
      index++;
      continue;
    }
    
    const price = Math.floor(Math.random() * 2500) + 50;
    const changePercent = parseFloat(((Math.random() - 0.5) * 4).toFixed(2));
    const change = parseFloat(((price * changePercent) / 100).toFixed(2));
    const open = parseFloat((price * (1 - (Math.random() - 0.5) * 0.01)).toFixed(2));
    const prevClose = parseFloat((price).toFixed(2));
    
    generated.push({
      symbol,
      name: `${group} ${sector} Industries Ltd.`,
      ltp: price,
      open,
      high: Math.max(price, open) * 1.01,
      low: Math.min(price, open) * 0.99,
      prevClose,
      volume: Math.floor(Math.random() * 3000000) + 10000,
      change,
      changePercent
    });
    
    index++;
  }
  
  return generated;
};

const INITIAL_STOCKS: StockQuote[] = generateNifty200();

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
