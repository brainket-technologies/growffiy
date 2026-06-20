import WebSocket from 'ws';
import { prisma } from '../../database/db';
import { API_ENDPOINTS } from '../../core/constants';
import { KiteClient } from '../services/kite';
import type { StockQuote } from './algoEngine';

export class WsLiveFeed {
  ws: WebSocket | null = null;
  static isReconnecting = false;
  stocksState: StockQuote[] = [];
  lastUpdate: { [symbol: string]: number } = {};
  activeApiKey: string | null = null;
  activeAccessToken: string | null = null;
  instrumentToSymbol: { [key: number]: string } = {};
  symbolToName: { [symbol: string]: string } = {};
  subscribedSymbols: Set<string> = new Set();

  private getPreOpenCache: () => StockQuote[];
  private getPreselected: () => Map<string, StockQuote>;

  constructor(getPreOpenCache: () => StockQuote[], getPreselected: () => Map<string, StockQuote>) {
    this.getPreOpenCache = getPreOpenCache;
    this.getPreselected = getPreselected;
  }

  async initialize() {
    try {
      const envApiKey = process.env.ZERODHA_API_KEY || process.env.KITE_API_KEY;
      const envAccessToken = process.env.ZERODHA_ACCESS_TOKEN || process.env.KITE_ACCESS_TOKEN;

      if (envApiKey && envAccessToken) {
        console.log('Using master Zerodha credentials configured in .env variables');
        this.connectKiteWebSocket(envApiKey, envAccessToken);
        return;
      }

      const client = await prisma.client.findFirst({
        where: { accessToken: { not: null }, zerodhaApiKey: { not: null } }
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

  async getActiveCredentials(): Promise<{ apiKey: string; accessToken: string } | null> {
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
      where: { accessToken: { not: null }, zerodhaApiKey: { not: null } }
    });
    if (client && client.zerodhaApiKey && client.accessToken) {
      this.activeApiKey = client.zerodhaApiKey;
      this.activeAccessToken = client.accessToken;
      return { apiKey: client.zerodhaApiKey, accessToken: client.accessToken };
    }
    return null;
  }

  getStockLtp(symbol: string): number {
    const stock = this.stocksState.find(s => s.symbol === symbol);
    if (stock && stock.ltp > 0) return stock.ltp;
    if (stock && stock.iep > 0) return stock.iep;
    return 0;
  }

  isWsConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  getStocks(): StockQuote[] {
    const preOpenCache = this.getPreOpenCache();
    if (this.stocksState.length === 0 && preOpenCache.length > 0) {
      this.stocksState = [...preOpenCache];
    }
    return this.stocksState;
  }

  async ensureInstrumentMapping() {
    if (Object.keys(this.instrumentToSymbol).length > 0) return;
    try {
      console.log('Fetching live instrument list from Zerodha Kite...');
      const res = await fetch(API_ENDPOINTS.KITE_INSTRUMENTS);
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
            if (name) nameMap[symbol] = name;
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

  connectKiteWebSocket(apiKey: string, accessToken: string) {
    if (WsLiveFeed.isReconnecting) {
      console.log('Kite Socket: Reconnect in progress. Skipping new connection attempt.');
      return;
    }
    this.activeApiKey = apiKey;
    this.activeAccessToken = accessToken;

    if (this.ws) {
      try { this.ws.close(); } catch {}
    }

    const wsUrl = `wss://ws.kite.trade?api_key=${apiKey}&access_token=${accessToken}`;
    console.log(`Connecting to Kite streaming endpoint...`);
    this.ws = new WebSocket(wsUrl);

    this.ws.on('open', async () => {
      console.log('Kite WebSocket connection established.');
      await this.ensureInstrumentMapping();

      const preOpenCache = this.getPreOpenCache();
      if (this.stocksState.length === 0 && preOpenCache.length > 0) {
        this.stocksState = [...preOpenCache];
      }

      let symbols = preOpenCache.slice(0, 50).map(s => s.symbol);
      if (symbols.length === 0) {
        symbols = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'LT', 'ITC'];
      }

      for (const stock of this.getPreselected().values()) {
        if (!symbols.includes(stock.symbol)) {
          symbols.push(stock.symbol);
        }
      }

      const tokens: number[] = [];
      for (const [tokenStr, sym] of Object.entries(this.instrumentToSymbol)) {
        if (symbols.includes(sym) && !tokens.includes(Number(tokenStr))) {
          tokens.push(Number(tokenStr));
        }
      }

      if (tokens.length === 0) {
        console.warn('No instrument tokens found for active symbols. WebSocket subscription standby.');
        return;
      }

      console.log(`Subscribing to ${tokens.length} live stock tokens on Kite WebSocket.`);
      this.ws?.send(JSON.stringify({ a: 'subscribe', v: tokens }));
      this.ws?.send(JSON.stringify({ a: 'mode', v: ['quote', tokens] }));
      for (const sym of symbols) this.subscribedSymbols.add(sym);
    });

    this.ws.on('message', (data: any) => {
      if (Buffer.isBuffer(data)) {
        this.parseKiteBinaryPacket(data);
      }
    });

    this.ws.on('error', (err: any) => {
      console.error('Kite Socket error:', err?.message || err);
      try { this.ws?.close(); } catch {}
    });

    this.ws.on('close', () => {
      if (WsLiveFeed.isReconnecting) {
        console.log('Kite Socket disconnected. Reconnect already scheduled. Skipping.');
        return;
      }
      WsLiveFeed.isReconnecting = true;
      console.log('Kite Socket disconnected. Reconnecting in 30 seconds...');
      setTimeout(() => {
        WsLiveFeed.isReconnecting = false;
        this.connectKiteWebSocket(apiKey, accessToken);
      }, 30000);
    });
  }

  subscribeSymbols(symbols: string[]) {
    const tokens: number[] = [];
    for (const sym of symbols) {
      if (this.subscribedSymbols.has(sym)) continue;
      for (const [tokenStr, s] of Object.entries(this.instrumentToSymbol)) {
        if (s === sym) {
          tokens.push(Number(tokenStr));
          break;
        }
      }
    }
    if (tokens.length === 0) return;
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ a: 'subscribe', v: tokens }));
    this.ws.send(JSON.stringify({ a: 'mode', v: ['quote', tokens] }));
    for (const sym of symbols) this.subscribedSymbols.add(sym);
    console.log(`WebSocket subscribed ${tokens.length} additional token(s): ${symbols.join(', ')}`);
  }

  resubscribeTopMovers(freshStocks: StockQuote[]) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    console.log('NSE pre-open fetch completed. Re-subscribing WebSocket to top 50 movers...');
    const symbols = freshStocks.slice(0, 50).map(s => s.symbol);
    for (const sym of this.subscribedSymbols) {
      if (!symbols.includes(sym)) symbols.push(sym);
    }
    const tokens: number[] = [];
    for (const [tokenStr, sym] of Object.entries(this.instrumentToSymbol)) {
      if (symbols.includes(sym) && !tokens.includes(Number(tokenStr))) {
        tokens.push(Number(tokenStr));
      }
    }
    if (tokens.length > 0) {
      this.ws.send(JSON.stringify({ a: 'subscribe', v: tokens }));
      this.ws.send(JSON.stringify({ a: 'mode', v: ['quote', tokens] }));
    }
    this.subscribedSymbols = new Set(symbols);
  }

  async fetchHistoricalCandles(client: any, symbol: string, interval: string, days = 1): Promise<number[][]> {
    const instTokenStr = Object.entries(this.instrumentToSymbol).find(([, sym]) => sym === symbol)?.[0];
    if (!instTokenStr || !client.zerodhaApiKey || !client.accessToken) return [];
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const from = `${y}-${m}-${String(Math.max(1, Number(d) - days)).padStart(2, '0')}%2009:15`;
    const to = `${y}-${m}-${d}%2015:30`;
    try {
      const res = await KiteClient.getHistoricalData(client.zerodhaApiKey, client.accessToken, instTokenStr, interval, from, to);
      if (res.status === 'success' && Array.isArray(res.data?.candles)) {
        return res.data.candles;
      }
    } catch {}
    return [];
  }

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
          ...stock, ltp,
          open: open || stock.open,
          high: high || stock.high,
          low: low || stock.low,
          prevClose: close || stock.prevClose,
          volume: volumeVal, change, changePercent,
          iep: ltp, final: ltp, finalQuantity: volumeVal,
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
        symbol, name, ltp, open, high, low, prevClose: close,
        volume: volumeVal, change, changePercent, iep: ltp, final: ltp,
        finalQuantity: volumeVal, value: (volumeVal * ltp) / 10000000,
        ffmCap: ltp * ffShares, nm52wH: high, nm52wL: low
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
          ...stock, ltp, change, changePercent,
          iep: ltp, final: ltp, value: (volumeVal * ltp) / 10000000,
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
        symbol, name, ltp, open: ltp, high: ltp, low: ltp, prevClose: ltp,
        volume: volumeVal, change: 0, changePercent: 0, iep: ltp, final: ltp,
        finalQuantity: volumeVal, value: (volumeVal * ltp) / 10000000,
        ffmCap: ltp * ffShares, nm52wH: ltp, nm52wL: ltp
      });
    }
  }
}
