import WebSocket from 'ws';
import { prisma } from '../lib/db';
import { API_ENDPOINTS } from '../lib/constants';
import { KiteClient } from '../lib/kite';
import { performKiteAutoLogin } from '../lib/kiteAutoLogin';



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
  iep: number;
  final: number;
  finalQuantity: number;
  value: number; // in Crores
  ffmCap: number; // in Crores
  nm52wH: number;
  nm52wL: number;
  // Dynamic Index Tagging
  isNifty50?: boolean;
  isBankNifty?: boolean;
  isFo?: boolean;
  isSme?: boolean;
}

class AlgoEngineService {
  private stocksState: StockQuote[] = [];
  private isTradingActive: boolean = false;
  private ws: WebSocket | null = null;
  private lastUpdate: { [symbol: string]: number } = {};

  // Kite credentials for live API fetches
  private activeApiKey: string | null = null;
  private activeAccessToken: string | null = null;

  // Dynamic instrument token mapping
  private instrumentToSymbol: { [key: number]: string } = {};
  private symbolToName: { [symbol: string]: string } = {};

  // In-memory pre-open cache
  private preOpenCache: StockQuote[] = [];
  private lastPreOpenFetchTime: number = 0;
  private preOpenCacheDate: string = '';

  constructor() {
    this.initializeKiteLiveFeed();
  }

  // Initialize Kite Live Socket feed from Environment variables or Database
  public async initializeKiteLiveFeed() {
    try {
      const envApiKey = process.env.ZERODHA_API_KEY || process.env.KITE_API_KEY;
      const envAccessToken = process.env.ZERODHA_ACCESS_TOKEN || process.env.KITE_ACCESS_TOKEN;

      if (envApiKey && envAccessToken) {
        console.log('Using master Zerodha credentials configured in .env variables');
        this.connectKiteWebSocket(envApiKey, envAccessToken);
        return;
      }

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
        console.log('No Zerodha details found in .env or database. WebSocket ticker standby.');
      }
    } catch (err) {
      console.error('Failed to configure Kite Connect socket feed:', err);
    }
  }

  private async ensureInstrumentMapping() {
    if (Object.keys(this.instrumentToSymbol).length > 0) {
      return;
    }
    try {
      console.log('Fetching live instrument list from Zerodha Kite...');
      const res = await fetch('https://api.kite.trade/instruments/NSE');
      if (!res.ok) throw new Error(`Kite instruments API returned status ${res.status}`);
      const text = await res.text();
      const lines = text.split('\n');
      const instMap: { [key: number]: string } = {};
      const nameMap: { [symbol: string]: string } = {};
      
      for (const line of lines) {
        const parts = line.split(',');
        if (parts.length >= 4) {
          const token = parseInt(parts[0], 10);
          const symbol = parts[2].trim().replace(/"/g, '');
          const name = parts[3].trim().replace(/"/g, '');
          if (!isNaN(token) && symbol) {
            instMap[token] = symbol;
            if (name) {
              nameMap[symbol] = name;
            }
          }
        }
      }
      this.instrumentToSymbol = instMap;
      this.symbolToName = nameMap;
      console.log(`Successfully mapped ${Object.keys(this.instrumentToSymbol).length} Zerodha NSE instrument tokens dynamically.`);
    } catch (e) {
      console.error('Failed to load dynamic Zerodha instrument mapping:', e);
    }
  }

  // Establish connection to Zerodha's wss streaming gateway
  private connectKiteWebSocket(apiKey: string, accessToken: string) {
    this.activeApiKey = apiKey;
    this.activeAccessToken = accessToken;

    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) { }
    }

    const wsUrl = `wss://ws.kite.trade?api_key=${apiKey}&access_token=${accessToken}`;
    console.log(`Connecting to Kite streaming endpoint...`);
    this.ws = new WebSocket(wsUrl);

    this.ws.on('open', async () => {
      console.log('Kite WebSocket connection established.');
      
      await this.ensureInstrumentMapping();
      
      // Seed stocksState from preOpenCache if empty
      if (this.stocksState.length === 0 && this.preOpenCache.length > 0) {
        this.stocksState = [...this.preOpenCache];
      }

      // Get the symbols in our current pre-open cache or state
      let symbols = this.preOpenCache.map(s => s.symbol);
      if (symbols.length === 0) {
        symbols = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'LT', 'ITC'];
      }
      
      const tokens: number[] = [];
      for (const [tokenStr, sym] of Object.entries(this.instrumentToSymbol)) {
        if (symbols.includes(sym)) {
          tokens.push(Number(tokenStr));
        }
      }
      
      if (tokens.length === 0) {
        console.warn('No instrument tokens found for active symbols. WebSocket subscription standby.');
        return;
      }

      console.log(`Subscribing to ${tokens.length} live stock tokens on Kite WebSocket.`);
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
          const symbol = this.instrumentToSymbol[token];
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
          const symbol = this.instrumentToSymbol[token];
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

  private async updateStockFromTick(symbol: string, ltp: number, open: number, high: number, low: number, close: number, volume: number) {
    this.lastUpdate[symbol] = Date.now();
    let exists = false;
    this.stocksState = this.stocksState.map(stock => {
      if (stock.symbol === symbol) {
        exists = true;
        const change = parseFloat((ltp - close).toFixed(2));
        const changePercent = close ? parseFloat(((change / close) * 100).toFixed(2)) : 0;
        const ffShares = 50.0;
        const volumeVal = volume || stock.volume || Math.round(ffShares * 15000);
        return {
          ...stock,
          ltp,
          open: open || stock.open,
          high: high || stock.high,
          low: low || stock.low,
          prevClose: close || stock.prevClose,
          volume: volumeVal,
          change,
          changePercent,
          iep: ltp,
          final: ltp,
          finalQuantity: volumeVal,
          value: (volumeVal * ltp) / 10000000,
          ffmCap: ltp * ffShares,
          nm52wH: high || stock.nm52wH,
          nm52wL: low || stock.nm52wL
        };
      }
      return stock;
    });

    if (!exists) {
      const name = this.symbolToName[symbol] || symbol;
      const change = parseFloat((ltp - close).toFixed(2));
      const changePercent = parseFloat(((change / close) * 100).toFixed(2));
      const ffShares = 50.0;
      const volumeVal = volume || Math.round(ffShares * 15000);
      this.stocksState.push({
        symbol,
        name,
        ltp,
        open,
        high,
        low,
        prevClose: close,
        volume: volumeVal,
        change,
        changePercent,
        iep: ltp,
        final: ltp,
        finalQuantity: volumeVal,
        value: (volumeVal * ltp) / 10000000,
        ffmCap: ltp * ffShares,
        nm52wH: high,
        nm52wL: low
      });
    }
  }

  private async updateStockLtp(symbol: string, ltp: number) {
    this.lastUpdate[symbol] = Date.now();
    let exists = false;
    this.stocksState = this.stocksState.map(stock => {
      if (stock.symbol === symbol) {
        exists = true;
        const change = parseFloat((ltp - stock.prevClose).toFixed(2));
        const changePercent = stock.prevClose ? parseFloat(((change / stock.prevClose) * 100).toFixed(2)) : 0;
        const ffShares = 50.0;
        const volumeVal = stock.volume || Math.round(ffShares * 15000);
        return {
          ...stock,
          ltp,
          change,
          changePercent,
          iep: ltp,
          final: ltp,
          value: (volumeVal * ltp) / 10000000,
          ffmCap: ltp * ffShares
        };
      }
      return stock;
    });

    if (!exists) {
      const name = this.symbolToName[symbol] || symbol;
      const ffShares = 50.0;
      const volumeVal = Math.round(ffShares * 15000);
      this.stocksState.push({
        symbol,
        name,
        ltp,
        open: ltp,
        high: ltp,
        low: ltp,
        prevClose: ltp,
        volume: volumeVal,
        change: 0,
        changePercent: 0,
        iep: ltp,
        final: ltp,
        finalQuantity: volumeVal,
        value: (volumeVal * ltp) / 10000000,
        ffmCap: ltp * ffShares,
        nm52wH: ltp,
        nm52wL: ltp
      });
    }
  }

  private async getActiveCredentials() {
    if (this.activeApiKey && this.activeAccessToken) {
      return { apiKey: this.activeApiKey, accessToken: this.activeAccessToken };
    }
    const envApiKey = process.env.ZERODHA_API_KEY || process.env.KITE_API_KEY;
    const envAccessToken = process.env.ZERODHA_ACCESS_TOKEN || process.env.KITE_ACCESS_TOKEN;
    if (envApiKey && envAccessToken) {
      this.activeApiKey = envApiKey;
      this.activeAccessToken = envAccessToken;
      return { apiKey: envApiKey, accessToken: envAccessToken };
    }
    const client = await prisma.client.findFirst({
      where: {
        accessToken: { not: null },
        zerodhaApiKey: { not: null }
      }
    });
    if (client && client.zerodhaApiKey && client.accessToken) {
      this.activeApiKey = client.zerodhaApiKey;
      this.activeAccessToken = client.accessToken;
      return { apiKey: client.zerodhaApiKey, accessToken: client.accessToken };
    }
    return null;
  }

  public isWsConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  public getStocks(): StockQuote[] {
    // If stocksState is empty, seed it with the current pre-open cache
    if (this.stocksState.length === 0 && this.preOpenCache.length > 0) {
      this.stocksState = [...this.preOpenCache];
    }
    return this.stocksState;
  }

  public toggleTrading(status: boolean) {
    this.isTradingActive = status;
  }

  public getTradingStatus(): boolean {
    return this.isTradingActive;
  }

  private async ensureApiKeyAndToken() {
    return this.getActiveCredentials();
  }

  public async executePreOpenTrades(adminId: string): Promise<void> {
    console.log('AlgoEngine: executePreOpenTrades started.');
    try {
      // 1. Fetch pre-open stocks
      const preOpenStocks = await this.getPreOpenStocks();
      if (!preOpenStocks || preOpenStocks.length === 0) {
        console.log('AlgoEngine: No pre-open stocks fetched. Aborting.');
        return;
      }

      // 2. Filter Top Loser Stock based on changePercent (lowest/most negative)
      let topLoser: StockQuote | null = null;
      for (const stock of preOpenStocks) {
        if (!topLoser || stock.changePercent < topLoser.changePercent) {
          topLoser = stock;
        }
      }

      if (!topLoser) {
        console.log('AlgoEngine: No top loser stock identified. Aborting.');
        return;
      }

      console.log(`AlgoEngine: Identified Today's Top Loser: ${topLoser.symbol} (${topLoser.changePercent}%)`);

      // 3. Find active clients assigned to a strategy with an active subscription
      const clients = await prisma.client.findMany({
        where: {
          tradingStatus: 'active',
          subscriptionStatus: 'active',
          strategyId: { not: null }
        },
        include: {
          user: true,
          strategy: true
        }
      });

      if (clients.length === 0) {
        console.log('AlgoEngine: No active clients assigned to any strategy.');
        return;
      }

      console.log(`AlgoEngine: Processing strategies for ${clients.length} active client(s).`);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Find an admin user in the system to log the action under if none is provided
      let finalAdminId = adminId;
      if (!finalAdminId || finalAdminId === 'system-admin-mock') {
        const firstAdmin = await prisma.user.findFirst({
          where: { role: 'admin' }
        });
        if (firstAdmin) {
          finalAdminId = firstAdmin.id;
        }
      }

      for (const client of clients) {
        try {
          const strategy = client.strategy;
          if (!strategy || strategy.status !== 'active') {
            console.log(`AlgoEngine: Skipping client ${client.user.name} - Strategy "${strategy?.name || 'Unknown'}" is missing or status is not active.`);
            continue;
          }

          // Parse config from the strategy record in the database
          const config = strategy.configJson ? JSON.parse(strategy.configJson) : null;
          
          // Verify if this is a Pre-Open strategy
          const isPreOpen = strategy.id === 'pre-open-breakout' || 
                            strategy.name.toLowerCase().includes('pre open') || 
                            strategy.name.toLowerCase().includes('pre-open') || 
                            (config?.basicInfo?.name && config.basicInfo.name.toLowerCase().includes('pre open'));
          
          if (!isPreOpen) {
            console.log(`AlgoEngine: Strategy ${strategy.name} for client ${client.user.name} is not a Pre-Open strategy. Skipping.`);
            continue;
          }

          // Check if trade already executed today for this client and strategy
          const existingTrade = await prisma.trade.findFirst({
            where: {
              clientId: client.id,
              strategyId: strategy.id,
              createdAt: {
                gte: todayStart
              }
            }
          });

          if (existingTrade) {
            console.log(`AlgoEngine: Trade already executed today for client ${client.user.name} under strategy ${strategy.name}. Skipping.`);
            continue;
          }

          // 4. Position sizing: perday 1% amount stock me lagana (allocate 1% of client capital)
          const capital = Number(client.capital);
          const allocatedAmount = capital * 0.01; 

          const entryPrice = topLoser.iep || topLoser.ltp || topLoser.prevClose || 100.0;
          let quantity = Math.floor(allocatedAmount / entryPrice);
          if (quantity <= 0) {
            quantity = 1; // Minimum 1 share
          }

          // Use stoploss and target values directly from the database strategy config if available
          const slPercent = config?.stoploss?.fixedPercent || 0.5;
          const targetPercent = config?.target?.profitPercent || 1.5;

          const stopLoss = entryPrice * (1 - slPercent / 100);
          const target = entryPrice * (1 + targetPercent / 100);

          console.log(`AlgoEngine: Placing trade for ${client.user.name} under database strategy "${strategy.name}" - Buy ${quantity} qty of ${topLoser.symbol} @ ${entryPrice}`);

          let orderId = 'simulated-order';
          let orderStatus = 'open';

          // 5. Use Kite Connect API if active credentials are setup for the client
          let activeAccessToken = client.accessToken;
          const isAutoLoginPossible = process.env.KITE_AUTO_LOGIN_ENABLED === 'true' && client.zerodhaPassword && client.zerodhaTotpSecret;

          if (!activeAccessToken && !isAutoLoginPossible) {
            console.log(`AlgoEngine: Skipping client ${client.user.name} - No active Kite session and auto-login credentials missing.`);
            await prisma.strategyLog.create({
              data: {
                strategyId: strategy.id,
                message: `Skipped trade execution for ${client.user.name}: No active Kite connection session, and auto-login credentials (password/TOTP) are not configured.`,
                logType: 'warning'
              }
            });
            continue;
          }

          if (process.env.KITE_AUTO_LOGIN_ENABLED === 'true') {
            if (client.zerodhaPassword && client.zerodhaTotpSecret) {
              console.log(`AlgoEngine: Auto-login is enabled. Refreshing session dynamically for client: ${client.user.name}`);
              const autoLoginRes = await performKiteAutoLogin(client.id);
              if (autoLoginRes.success && autoLoginRes.accessToken) {
                activeAccessToken = autoLoginRes.accessToken;
              } else {
                console.warn(`AlgoEngine: Dynamic auto-login failed for ${client.user.name}: ${autoLoginRes.error}`);
              }
            } else {
              console.log(`AlgoEngine: Auto-login is enabled but client ${client.user.name} is missing password or TOTP secret. Skipping dynamic auto-refresh.`);
            }
          }

          if (!activeAccessToken) {
            console.log(`AlgoEngine: Skipping client ${client.user.name} - Failed to establish Kite API session.`);
            await prisma.strategyLog.create({
              data: {
                strategyId: strategy.id,
                message: `Skipped trade execution for ${client.user.name}: Kite session could not be established (auto-login failed or manual login required).`,
                logType: 'error'
              }
            });
            continue;
          }

          if (client.zerodhaApiKey && activeAccessToken) {
            try {
              const orderRes = await KiteClient.placeOrder(
                client.zerodhaApiKey,
                activeAccessToken,
                {
                  exchange: 'NSE',
                  tradingsymbol: topLoser.symbol,
                  transaction_type: 'BUY',
                  quantity: quantity,
                  order_type: 'MARKET',
                  product: 'MIS',
                  validity: 'DAY'
                }
              );
              console.log('AlgoEngine: Kite order placement response:', orderRes);
              if (orderRes && orderRes.status === 'success' && orderRes.data?.order_id) {
                orderId = orderRes.data.order_id;
              } else {
                console.warn('AlgoEngine: Kite order response status was not success. Placing simulated trade.');
              }
            } catch (kiteErr: any) {
              console.error(`AlgoEngine: Failed to place order on Zerodha Kite for ${client.user.name}:`, kiteErr);
              // Save to strategy logs
              await prisma.strategyLog.create({
                data: {
                  strategyId: strategy.id,
                  message: `Kite order failed for ${client.user.name}: ${kiteErr.message || 'API error'}. Trade placed as simulated.`,
                  logType: 'error'
                }
              });
            }
          }

          // 6. Save trade in Database referencing the database strategy ID
          await prisma.trade.create({
            data: {
              clientId: client.id,
              strategyId: strategy.id,
              symbol: topLoser.symbol,
              orderType: 'MIS',
              entryPrice: entryPrice,
              quantity: quantity,
              stopLoss: stopLoss,
              target: target,
              status: orderStatus,
              entryTime: new Date()
            }
          });

          // 7. Write strategy log referencing the database strategy ID
          await prisma.strategyLog.create({
            data: {
              strategyId: strategy.id,
              message: `Intraday Trade Initiated for ${client.user.name}: Bought ${quantity} shares of ${topLoser.symbol} at entry price ₹${entryPrice.toFixed(2)} using config from DB strategy "${strategy.name}". Capital allocated (1%): ₹${allocatedAmount.toFixed(2)}. Target: ₹${target.toFixed(2)} (${targetPercent}%), Stop Loss: ₹${stopLoss.toFixed(2)} (${slPercent}%).`,
              logType: 'trade'
            }
          });

          // 8. Write audit log
          if (finalAdminId) {
            await prisma.auditLog.create({
              data: {
                adminId: finalAdminId,
                action: 'AUTO TRADE INITIATED',
                oldValue: null,
                newValue: `Client: ${client.user.name} | Strategy: ${strategy.name} | Stock: ${topLoser.symbol} | Qty: ${quantity} | Entry: ${entryPrice.toFixed(2)}`
              }
            }).catch(() => {});
          }

        } catch (clientErr: any) {
          console.error(`AlgoEngine: Error executing pre-open trade for client ${client.id}:`, clientErr);
        }
      }

    } catch (e: any) {
      console.error('AlgoEngine: executePreOpenTrades error:', e);
    }
  }


  public async fetchLivePreOpenFromNSE(): Promise<StockQuote[]> {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': API_ENDPOINTS.NSE_REFERER,
    };

    try {
      console.log('Initiating pre-open fetch from official NSE India API...');
      const homeRes = await fetch(API_ENDPOINTS.NSE_HOME, { headers });
      const rawCookies = homeRes.headers.get('set-cookie') || '';
      const cookies = rawCookies.split(',').map(c => c.split(';')[0]).join('; ');

      const fetchIndexSymbols = async (key: string): Promise<string[]> => {
        try {
          const res = await fetch(`https://www.nseindia.com/api/market-data-pre-open?key=${key}`, {
            headers: { ...headers, 'Cookie': cookies }
          });
          if (!res.ok) return [];
          const json = await res.json();
          if (json && Array.isArray(json.data)) {
            return json.data.map((item: any) => item.metadata?.symbol).filter(Boolean);
          }
        } catch (e) {
          console.error(`Failed to fetch symbols for index key ${key}:`, e);
        }
        return [];
      };

      const [dataRes, niftySymbols, bankNiftySymbols, foSymbols, smeSymbols] = await Promise.all([
        fetch(API_ENDPOINTS.NSE_PRE_OPEN, { headers: { ...headers, 'Cookie': cookies } }),
        fetchIndexSymbols('NIFTY'),
        fetchIndexSymbols('BANKNIFTY'),
        fetchIndexSymbols('FO'),
        fetchIndexSymbols('SME')
      ]);

      if (!dataRes.ok) {
        throw new Error(`NSE API responded with status ${dataRes.status}`);
      }

      const nseJson = await dataRes.json();
      if (!nseJson || !Array.isArray(nseJson.data)) {
        throw new Error('Invalid JSON format from NSE Pre-Open API');
      }

      console.log(`Successfully retrieved ${nseJson.data.length} pre-open quotes from NSE.`);

      const freshStocks: StockQuote[] = nseJson.data
        .filter((nseItem: any) => nseItem.metadata && nseItem.metadata.symbol)
        .map((nseItem: any) => {
          const symbol = nseItem.metadata.symbol;
          const name = nseItem.metadata.companyName || symbol;
          const prevClose = nseItem.metadata.previousClose || 100.0;
          const iep = nseItem.metadata.iep || nseItem.metadata.lastPrice || prevClose;
          const change = nseItem.metadata.change || 0;
          const changePercent = nseItem.metadata.pChange || 0;
          const ltp = iep;
          const open = iep;
          const high = nseItem.metadata.yearHigh || iep;
          const low = nseItem.metadata.yearLow || iep;
          const volume = nseItem.metadata.finalQuantity || nseItem.detail?.preOpenMarket?.totalTradedVolume || 0;
          const ffmCap = ltp * 50.0;
          const value = (nseItem.metadata.totalTurnover || (volume * ltp)) / 10000000;

          return {
            symbol,
            name,
            ltp,
            open,
            high,
            low,
            prevClose,
            volume,
            change,
            changePercent,
            iep,
            final: ltp,
            finalQuantity: volume,
            value,
            ffmCap,
            nm52wH: nseItem.metadata.yearHigh || parseFloat((prevClose * 1.25).toFixed(2)),
            nm52wL: nseItem.metadata.yearLow || parseFloat((prevClose * 0.75).toFixed(2)),
            isNifty50: niftySymbols.includes(symbol),
            isBankNifty: bankNiftySymbols.includes(symbol),
            isFo: foSymbols.includes(symbol),
            isSme: smeSymbols.includes(symbol)
          };
        });

      const dateStr = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      this.preOpenCache = freshStocks;
      this.preOpenCacheDate = dateStr;
      this.lastPreOpenFetchTime = Date.now();

      // Dynamically re-subscribe WebSocket to newly fetched pre-open symbols
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('NSE pre-open fetch completed. Re-subscribing WebSocket to dynamic symbols...');
        const symbols = freshStocks.map(s => s.symbol);
        const tokens: number[] = [];
        for (const [tokenStr, sym] of Object.entries(this.instrumentToSymbol)) {
          if (symbols.includes(sym)) {
            tokens.push(Number(tokenStr));
          }
        }
        if (tokens.length > 0) {
          this.ws.send(JSON.stringify({ a: 'subscribe', v: tokens }));
          this.ws.send(JSON.stringify({ a: 'mode', v: ['quote', tokens] }));
        }
      }

      return freshStocks;
    } catch (err) {
      console.error('NSE API pre-open fetch failed:', err);
      return this.preOpenCache;
    }
  }

  public async fetchLivePreOpenFromKite(): Promise<StockQuote[]> {
    return this.fetchLivePreOpenFromNSE();
  }

  public async getPreOpenStocks(): Promise<StockQuote[]> {
    if (this.preOpenCache.length === 0 || Date.now() - this.lastPreOpenFetchTime > 5 * 60 * 1000) {
      await this.fetchLivePreOpenFromNSE();
    }
    return this.preOpenCache;
  }

  private lastHttpFetchTime = 0;

  public async updateLiveQuotesFromKiteHTTP() {
    if (process.env.USE_HTTP_POLLING !== 'true') {
      return;
    }

    if (Date.now() - this.lastHttpFetchTime < 3000) {
      return;
    }

    const creds = await this.ensureApiKeyAndToken();
    if (!creds) {
      console.log('No active Kite credentials found to fetch HTTP live quotes.');
      return;
    }

    if (this.stocksState.length === 0 && this.preOpenCache.length > 0) {
      this.stocksState = [...this.preOpenCache];
    }

    const symbols = this.stocksState.map(s => s.symbol);
    if (symbols.length === 0) return;

    try {
      console.log(`Fetching HTTP live quotes for ${symbols.length} symbols from Kite API...`);
      const queryParams = symbols.map(sym => `i=NSE:${sym}`).join('&');
      const url = `https://api.kite.trade/quote?${queryParams}`;

      const res = await fetch(url, {
        headers: {
          'Authorization': `token ${creds.apiKey}:${creds.accessToken}`,
          'X-Kite-Version': '3'
        }
      });

      if (!res.ok) {
        throw new Error(`Kite HTTP quote fetch failed with status ${res.status}`);
      }

      const json = await res.json();
      if (json && json.status === 'success' && json.data) {
        this.stocksState = this.stocksState.map(stock => {
          const key = `NSE:${stock.symbol}`;
          const tick = json.data[key];
          if (tick) {
            const ltp = tick.last_price;
            const close = tick.ohlc?.close || stock.prevClose || ltp;
            const change = parseFloat((ltp - close).toFixed(2));
            const changePercent = close ? parseFloat(((change / close) * 100).toFixed(2)) : 0;
            const ffShares = 50.0;
            const volumeVal = tick.volume || stock.volume || Math.round(ffShares * 15000);
            return {
              ...stock,
              ltp,
              open: tick.ohlc?.open || stock.open || ltp,
              high: tick.ohlc?.high || stock.high || ltp,
              low: tick.ohlc?.low || stock.low || ltp,
              prevClose: close,
              volume: volumeVal,
              change,
              changePercent,
              iep: ltp,
              final: ltp,
              finalQuantity: volumeVal,
              value: (volumeVal * ltp) / 10000000,
              ffmCap: ltp * ffShares,
            };
          }
          return stock;
        });

        this.lastHttpFetchTime = Date.now();
        console.log('Successfully updated stocksState with live quotes from Kite HTTP API.');
      }
    } catch (err) {
      console.error('Failed to update live quotes from Kite HTTP API:', err);
    }
  }

  public getPreOpenDate(): string {
    return this.preOpenCacheDate || new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}

const globalForAlgo = global as unknown as { algoEngine: AlgoEngineService };
export const algoEngine = globalForAlgo.algoEngine || new AlgoEngineService();
if (process.env.NODE_ENV !== 'production') globalForAlgo.algoEngine = algoEngine;
