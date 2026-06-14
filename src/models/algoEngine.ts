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
const INITIAL_STOCKS: StockQuote[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', ltp: 2450.00, open: 2465.00, high: 2475.00, low: 2440.00, prevClose: 2460.00, volume: 5200000, change: -10, changePercent: -0.41 },
  { symbol: 'WIPRO', name: 'Wipro Limited', ltp: 412.50, open: 418.00, high: 419.50, low: 410.00, prevClose: 420.00, volume: 3800000, change: -7.50, changePercent: -1.79 },
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.', ltp: 3210.00, open: 3240.00, high: 3255.00, low: 3200.00, prevClose: 3250.00, volume: 1500000, change: -40, changePercent: -1.23 },
  { symbol: 'INFY', name: 'Infosys Limited', ltp: 1420.00, open: 1445.00, high: 1450.00, low: 1412.00, prevClose: 1450.00, volume: 4200000, change: -30, changePercent: -2.07 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Limited', ltp: 1610.00, open: 1615.00, high: 1625.00, low: 1605.00, prevClose: 1618.00, volume: 6500000, change: -8, changePercent: -0.49 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Limited', ltp: 935.00, open: 945.00, high: 950.00, low: 930.00, prevClose: 948.00, volume: 5100000, change: -13, changePercent: -1.37 },
  { symbol: 'SBIN', name: 'State Bank of India', ltp: 572.00, open: 585.00, high: 588.00, low: 569.00, prevClose: 586.00, volume: 8900000, change: -14, changePercent: -2.39 },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Limited', ltp: 620.00, open: 638.00, high: 641.00, low: 615.00, prevClose: 640.00, volume: 12000000, change: -20, changePercent: -3.12 },
  { symbol: 'ADANIENT', name: 'Adani Enterprises Ltd.', ltp: 2410.00, open: 2470.00, high: 2475.00, low: 2390.00, prevClose: 2480.00, volume: 2200000, change: -70, changePercent: -2.82 },
  { symbol: 'ADANIPORTS', name: 'Adani Ports & SEZ Ltd.', ltp: 785.00, open: 810.00, high: 815.00, low: 780.00, prevClose: 812.00, volume: 3500000, change: -27, changePercent: -3.33 },
];

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
