# Pre-Open Momentum Breakout — Complete System Flow

---

## 1. System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                      algoEngine.ts (1582 lines)                              │
│                                                                              │
│  ┌──────────────────────────────────────────────┐                           │
│  │ Class AlgoEngineService                       │                           │
│  │                                               │                           │
│  │ Properties:                                   │                           │
│  │  • stocksState: StockQuote[]                  │ → Live market data       │
│  │  • preOpenCache: StockQuote[]                 │ → NSE pre-open cache     │
│  │  • preselectedForClient: Map<string, Stock>   │ → Stage 1.5 output       │
│  │  • instrumentToSymbol: {token → symbol}       │ → Kite instrument map    │
│  │  • ws: WebSocket                             │ → Kite live feed         │
│  │  • isTradingActive: boolean                   │                          │
│  │                                               │                          │
│  │ Constructor():                              │ → line 64                │
│  │  ├─ initializeKiteLiveFeed()                 │ → WebSocket connect     │
│  │  ├─ startDailyTokenRefreshScheduler()        │ → 08:00 refresh         │
│  │  ├─ startDailyPreOpenStrategyScheduler()    │ → 09:08/09:15/09:20     │
│  │  └─ startActiveTradesMonitoringScheduler()  │ → 60s loop SL/Target    │
│  └──────────────────────────────────────────────┘                           │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Current State

### Table: `strategies` — 1 Active Row

```
id:      c7bafa89-3403-44c3-bcd0-199602c878e1
name:    Pre Open Momentum Breakout
status:  active
```

```json
{
  "basicInfo": {
    "name": "Pre-Open Momentum Breakout",
    "description": "Scans Nifty 200 for maximum gap-downs at 09:08 AM, buys high of 5-min candle with 1% risk.",
    "tradeType": "Intraday",
    "exchange": "NSE",
    "segment": "NSE F&O",
    "timeframe": "5m",
    "entryTime": "09:20",
    "preSelectTime": "09:15",
    "exitTime": "15:15",
    "maxTradesPerDay": 3,
    "selectPosition": 1,
    "status": "active"
  },
  "tradeAction": { "action": "Long", "orderType": "Limit", "bufferPercent": 0.1 },
  "stoploss": { "type": "Trailing SL", "fixedPercent": 0.5, "trailingSL": 0.2 },
  "target": { "profitPercent": 1.5, "trailingTarget": 0.5 },
  "riskManagement": { "riskPerTrade": 1, "capitalAllocation": 10 },
  "conditions": []
}
```

### Table: `clients` — 1 Active Client

```
id:                  b364d72f-e2e2-4dbc-bbef-3286c75e1875
zerodha_client_id:   RZJ500
capital:             ₹50,000 | risk_percentage: 1%
trading_status:      active | subscription_status: active
strategy_id:         c7bafa89-...
```

### Table: `app_settings` — Algo Timings

```
algo_preopen_fetch_time → 09:08
algo_entry_time         → 09:20
algo_token_refresh_time → 08:00
algo_check_interval_sec → 60
```

---

## 3. Complete Execution Flow

Har stage me **Bina Code (plain explanation)** + **Code (actual code from algoEngine.ts)** dono diya gaya hai.

---

### ⏰ 08:00 — Token Refresh

#### Bina Code
```
Kya KITE_AUTO_LOGIN_ENABLED = true hai?
→ Nahi → kuch mat karo, skip
→ Ha → client ki zerodhaPassword + zerodhaTotpSecret lo
       → TOTP generate karo
       → Kite login API call karo
       → naya accessToken aayega
       → client.accessToken DB me update karo
```

#### Code (`algoEngine.ts:151-174`)
```typescript
private startDailyTokenRefreshScheduler() {
  const checkAndRefresh = async () => {
    if (process.env.KITE_AUTO_LOGIN_ENABLED !== 'true') return;

    cachedRefreshTime = await this.getAlgoSetting('algo_token_refresh_time', '08:00');

    if (currentTimeStr === cachedRefreshTime && lastRefreshedDate !== currentDateKey) {
      for (const client of clients) {
        const res = await performKiteAutoLogin(client.id);
        if (res.success && res.accessToken) {
          // client.accessToken updated in DB
        }
      }
      lastRefreshedDate = currentDateKey;
    }
  };
  setInterval(checkAndRefresh, 60 * 1000);
}
```

---

### ⏰ 09:08 — Pre-Open Data Fetch (Stage 1)

#### Bina Code
```
Scheduler har 60 second check karta hai.
Jab time 09:08 hota hai aur aaj ka data nahi fetch hua:

1. NSE India ki official API call karo
   → Pehle NSE homepage se cookies lo
   → Phir pre-open API call karo
2. JSON response parse karo → har stock ka:
   - symbol, name, ltp, high, low
   - changePercent, prevClose
   - isFo (F&O stock?), isNifty50?, isBankNifty?
3. preOpenCache[] memory me store karo
4. PRE_OPEN_QUOTES_DATA app_setting DB me store karo
5. WebSocket ko naye symbols subscribe karo
```

#### Code (`algoEngine.ts:1477-1489` + `1349-1471`)
```typescript
// getPreOpenStocks - line 1477
public async getPreOpenStocks(): Promise<StockQuote[]> {
  if (this.preOpenCache.length === 0 || this.preOpenCacheDate !== todayDateStr) {
    await this.fetchLivePreOpenFromNSE();
  }
  return this.preOpenCache;
}

// fetchLivePreOpenFromNSE - line 1349
private async fetchLivePreOpenFromNSE(): Promise<StockQuote[]> {
  // NSE API call
  const dataRes = await fetch(API_ENDPOINTS.NSE_PRE_OPEN, { headers });

  // Parse response
  const freshStocks: StockQuote[] = nseJson.data.map((nseItem) => ({
    symbol: nseItem.metadata.symbol,
    ltp: nseItem.metadata.iep,
    changePercent: nseItem.metadata.pChange,
    isFo: foSymbols.includes(symbol),
    isNifty50: niftySymbols.includes(symbol),
    // ...
  }));

  this.preOpenCache = freshStocks;
  return freshStocks;
}
```

---

### ⏰ 09:15 — Pre-Select Stock (Stage 1.5)

#### Bina Code
```
preSelectTime strategy config se aata hai (default 09:15)

1. preOpenCache se data lo (jo 09:08 ko fetch hua)
2. Active clients DB se dhundo
3. Har client ke liye:

   STEP A: SEGMENT FILTER
     → config.segment = "NSE F&O"
     → sirf woh stocks pass jinka isFo = true hai

   STEP B: CONDITIONS FILTER
     → config.conditions array check karo
     → agar empty hai → sab pass
     → agar "Pre Open Change % < -1.5" hai:
         → sirf woh stocks pass jinka changePercent < -1.5
     → agar "Price Action >= Previous 5m High" hai:
         → sirf woh stocks pass jinka ltp >= stock.high

   STEP C: SORT
     → action = "Long" → ascending (sabse zyada negative pehle)
     → action = "Short" → descending (sabse zyada positive pehle)

   STEP D: PICK POSITION
     → selectPosition = 1 → sortedStocks[0] lo

   STEP E: STORE IN MAP
     → client.id → selected stock (RAM me, DB nahi)

4. Console: "RZJ500 → #1 HINDALCO(-4.20%)"
```

#### Code (`algoEngine.ts:756-846`)
```typescript
private async preSelectAllClients(): Promise<void> {
  const preOpenStocks = this.preOpenCache.length > 0
    ? this.preOpenCache
    : await this.getPreOpenStocks();

  const clients = await prisma.client.findMany({
    where: { tradingStatus: 'active', subscriptionStatus: 'active', strategyId: { not: null } },
    include: { user: true, strategy: true }
  });

  this.preselectedForClient.clear();

  for (const client of clients) {
    const config = JSON.parse(strategy.configJson);
    const segment = config.basicInfo?.segment || 'NSE F&O';

    // --- SEGMENT FILTER ---
    const matchingStocks = preOpenStocks.filter(stock => {
      if (segment === 'NSE F&O' && !stock.isFo) return false;

      // --- CONDITIONS FILTER ---
      if (config.conditions && Array.isArray(config.conditions)) {
        for (const cond of config.conditions) {
          if (cond.indicator === 'Pre Open Change %') {
            const val = Number(cond.value);
            if (cond.operator === '<' && !(stock.changePercent < val)) return false;
          } else if (cond.indicator === 'Price Action') {
            if (cond.value === 'Previous 5m High') {
              const prevHigh = stock.high || stock.prevClose || stock.ltp;
              if (cond.operator === '>' && !(stock.ltp > prevHigh)) return false;
            }
          }
        }
      }
      return true;
    });

    // --- SORT ---
    const action = config.tradeAction?.action || 'Long';
    const sortedStocks = [...matchingStocks].sort((a, b) =>
      action === 'Long' ? a.changePercent - b.changePercent : b.changePercent - a.changePercent
    );

    // --- PICK POSITION ---
    const selectPosition = config.basicInfo?.selectPosition || 1;
    const selected = sortedStocks[selectPosition - 1];

    // --- STORE ---
    this.preselectedForClient.set(client.id, selected);
  }
}
```

---

### ⏰ 09:15 to 09:20 — 5-Min Candle Build

#### Bina Code
```
Market 09:15 ko opens hota hai.
Is 5 minute mein (09:15 to 09:20) har stock ki ek 5-min candle banti hai.

Example: HINDALCO
  09:15 → ₹191.60 (open)
  09:16 → ₹193.00
  09:17 → ₹194.50
  09:18 → ₹196.80 (HIGH)
  09:19 → ₹195.50
  09:20 → ₹200.20 (current LTP)

Candle: [open=191.60, HIGH=196.80, low=191.00, close=195.50]

Yeh candle breakout check ke liye use hogi.
```

#### Code
```
Koi code nahi — yeh live market mein apne aap hota hai.
Algo engine 09:20 par is candle ko Kite API se fetch karega.
```

---

### ⏰ 09:20 — Trade Execution (Stage 2)

#### Bina Code
```
1. MAP SE PRESELECTED STOCK LO
   → client.id se Map check karo
   → HINDALCO mila? → use karo
   → nahi mila? → fallback: full filter + sort + rank karo

2. EXISTING TRADE CHECK
   → Kya aaj is client ne HINDALCO ka trade kiya hai?
   → Ha → skip (do baar trade nahi karenge)

3. 5-MIN CANDLE FETCH (Kite API)
   → instToken dhundo (instrument map se)
   → historicalData(apiKey, token, "5minute", "09:15", "09:20")
   → 1 candle aati hai → uske HIGH[2] lo
   → candleHigh = 196.80

4. ENTRY PRICE CALCULATE
   → bufferPercent = 0.1%
   → entryPrice = 196.80 × 1.001 = ₹196.99

5. BREAKOUT CHECK
   → currentLTP = 200.20 (live price)
   → kya conditions mein "Price Action" hai?
     → Nahi (conditions empty) → breakout automatically true ✅
     → Ha → tab LTP >= candleHigh hona chahiye
   → BREAKOUT CONFIRMED → targetStock = HINDALCO

6. KITE SESSION CHECK
   → client.accessToken hai? → ha
   → nahi hai aur auto-login enabled hai? → TOTP login

7. POSITION SIZING
   → Kite margins API se net equity = ₹8,00,000
   → riskPerTrade = 1% → allocated = ₹8,000
   → client.capital = ₹50,000 (cap)
   → tradeAmount = min(8000, 50000) = ₹8,000
   → qty = floor(8000 / 196.99) = 40 shares

8. SL & TARGET
   → SL% = 0.5% → SL₹ = 196.99 × 0.995 = ₹196.00
   → Target% = 1.5% → Target₹ = 196.99 × 1.015 = ₹200.02
   → orderType = "Limit" → LIMIT order @ ₹196.99

9. KITE PAR ORDER LAGAO
   → BUY HINDALCO 40 qty LIMIT 196.99 MIS DAY
   → response aaya → order_id mila

10. DB ME SAVE KARO
    → trades table: status = "OPEN"
    → strategy_logs: trade log
    → audit_logs: audit entry
```

#### Code (`algoEngine.ts:848-1346`)
```typescript
public async executePreOpenTrades(adminId: string): Promise<void> {
  const preOpenStocks = await this.getPreOpenStocks();
  const clients = await prisma.client.findMany({
    where: { tradingStatus: 'active', subscriptionStatus: 'active', strategyId: { not: null } },
    include: { user: true, strategy: true }
  });

  for (const client of clients) {
    const strategy = client.strategy;
    const config = JSON.parse(strategy.configJson);

    // --- STEP 1: PRESELECTED MAP CHECK ---
    let candidateStock = this.preselectedForClient.get(client.id) || null;
    this.preselectedForClient.delete(client.id);

    if (!candidateStock) {
      // Fallback: full filter + sort + rank
      const matchingStocks = preOpenStocks.filter(/* F&O + conditions filter */);
      const sortedStocks = [...matchingStocks].sort(/* sort logic */);
      candidateStock = sortedStocks[config.basicInfo?.selectPosition - 1];
    }

    // --- STEP 2: EXISTING TRADE CHECK ---
    const existingTrade = await prisma.trade.findFirst({
      where: { clientId: client.id, strategyId: strategy.id,
               symbol: candidateStock.symbol, createdAt: { gte: todayStart } }
    });
    if (existingTrade) continue;

    // --- STEP 3: 5-MIN CANDLE FETCH ---
    const res = await KiteClient.getHistoricalData(
      apiKey, accessToken, token, '5minute', from, to
    );
    let candleHigh = Number(res.data.candles[0][2]);

    // --- STEP 4: ENTRY PRICE ---
    const bufferPct = config.tradeAction?.bufferPercent || 0.1;
    const entryPrice = candleHigh * (1 + bufferPct / 100);

    // --- STEP 5: BREAKOUT CHECK ---
    const currentLtp = candidateStock.ltp || candidateStock.iep || entryPrice;
    const hasPriceAction = config.conditions?.some((c: any) => c.indicator === 'Price Action');

    if (!hasPriceAction || currentLtp >= candleHigh) {
      targetStock = candidateStock;  // ✅ BREAKOUT
    } else {
      continue;  // ❌ BREAKOUT NOT MET
    }

    // --- STEP 6: KITE SESSION ---
    if (!client.accessToken) {
      if (client.zerodhaPassword && client.zerodhaTotpSecret) {
        const autoLoginRes = await performKiteAutoLogin(client.id);
        // use new accessToken
      }
    }

    // --- STEP 7: POSITION SIZING ---
    const marginRes = await KiteClient.getMargins(apiKey, accessToken);
    let liveBalance = Number(marginRes.data.equity.net);
    const riskPerTrade = config.riskManagement?.riskPerTrade || 1;
    let allocatedAmount = liveBalance * (riskPerTrade / 100);
    const dbCapitalLimit = Number(client.capital);
    if (allocatedAmount > dbCapitalLimit) allocatedAmount = dbCapitalLimit;
    const qty = Math.floor(allocatedAmount / entryPrice);

    // --- STEP 8: SL & TARGET ---
    const slPercent = config?.stoploss?.fixedPercent || 0.5;
    const targetPercent = config?.target?.profitPercent || 2.0;
    const stopLoss = entryPrice * (1 - slPercent / 100);
    const target = entryPrice * (1 + targetPercent / 100);

    // --- STEP 9: PLACE ORDER ---
    const orderRes = await KiteClient.placeOrder(apiKey, accessToken, {
      exchange: 'NSE',
      tradingsymbol: targetStock.symbol,
      transaction_type: 'BUY',
      quantity: qty,
      order_type: 'LIMIT',
      product: 'MIS',
      validity: 'DAY',
      price: entryPrice
    });

    // --- STEP 10: SAVE TRADE ---
    await prisma.trade.create({
      data: {
        clientId: client.id, strategyId: strategy.id,
        symbol: targetStock.symbol, entryPrice, quantity: qty,
        stopLoss, target, status: 'OPEN'
      }
    });

    // --- STEP 11: LOGS ---
    await prisma.strategyLog.create({ data: { strategyId: strategy.id, message: '...' } });
    await prisma.auditLog.create({ data: { adminId, action: 'AUTO TRADE INITIATED', newValue: '...' } });
  }
}
```

---

### ⏰ 09:20 to 15:15 — Monitor SL/Target

#### Bina Code
```
Har 60 second:

1. DB se saare OPEN trades fetch karo
2. Har trade ke liye:

   a. Kite API se latest candle lo
   b. candle ka close price = current price

   c. SL CHECK:
      → SL ₹ = entryPrice × 0.995
      → agar currentPrice <= SL:
         → MARKET SELL order lagao
         → trade status = "closed"
         → p&L calculate karo

   d. TARGET CHECK:
      → Target ₹ = entryPrice × 1.015
      → agar currentPrice >= Target:
         → MARKET SELL order lagao
         → trade status = "closed"
         → P&L calculate karo

3. DB updates:
   → trades table: status, exitPrice, pnl
   → strategy_logs: exit log
   → audit_logs: audit entry
```

#### Code (`algoEngine.ts:212-394`)
```typescript
private startActiveTradesMonitoringScheduler() {
  const checkOpenTradesExits = async () => {
    const openTrades = await prisma.trade.findMany({
      where: { status: 'open' },
      include: { client, strategy }
    });

    for (const trade of openTrades) {
      const config = JSON.parse(trade.strategy.configJson);
      const slPercent = config?.stoploss?.fixedPercent || 0.5;
      const targetPercent = config?.target?.profitPercent || 2.0;

      // Fetch latest candle
      const res = await KiteClient.getHistoricalData(apiKey, token, interval, from, to);
      const latestCandle = res.data.candles[res.data.candles.length - 1];
      const currentPrice = Number(latestCandle[4]);

      const stopLossLevel = Number(trade.entryPrice) * (1 - slPercent / 100);
      const targetLevel = Number(trade.entryPrice) * (1 + targetPercent / 100);

      if (currentPrice <= stopLossLevel) {
        // STOP LOSS HIT → SELL
        const sellRes = await KiteClient.placeOrder(apiKey, token, {
          tradingsymbol: trade.symbol, transaction_type: 'SELL',
          quantity: trade.quantity, order_type: 'MARKET'
        });
        await prisma.trade.update({
          where: { id: trade.id },
          data: { status: 'closed', exitPrice: currentPrice, pnl }
        });
      } else if (currentPrice >= targetLevel) {
        // TARGET HIT → SELL (same logic)
      }
    }
  };
  setInterval(checkOpenTradesExits, 60 * 1000);
}
```

---

## 4. Complete Example — Client RZJ500

```
╔══════════════════════════════════════════════════════════════════════╗
║                    CLIENT: RZJ500 (b364d72f)                       ║
║                    CAPITAL: ₹50,000 | RISK: 1%                     ║
║                    STRATEGY: Pre-Open Momentum Breakout             ║
║                    SEGMENT: NSE F&O | POSITION: #1 | ENTRY: 09:20  ║
╚══════════════════════════════════════════════════════════════════════╝

                            NSE DATA (SAMPLE)
       ┌──────────────┬───────────┬──────────┬──────┬──────┐
       │ Symbol       │ PrevClose │ IEP      │Chg%  │isFo │
       ├──────────────┼───────────┼──────────┼──────┼──────┤
       │ HINDALCO     │ 200.00    │ 191.60   │-4.20%│ YES  │
       │ TATASTEEL    │ 150.00    │ 144.75   │-3.50%│ YES  │
       │ JSWSTEEL     │ 800.00    │ 780.00   │-2.50%│ YES  │
       │ BHARTIARTL   │ 500.00    │ 491.00   │-1.80%│ YES  │
       │ RELIANCE     │ 2500.00   │ 2470.00  │-1.20%│ YES  │
       │ HDFCBANK     │ 1600.00   │ 1590.00  │-0.62%│ YES  │
       │ SBIN         │ 600.00    │ 598.00   │-0.33%│ YES  │
       │ ICICIBANK    │ 1000.00   │ 1003.00  │+0.30%│ YES  │
       │ INFY         │ 1500.00   │ 1515.00  │+1.00%│ YES  │
       │ TCS          │ 3500.00   │ 3550.00  │+1.43%│ YES  │
       └──────────────┴───────────┴──────────┴──────┴──────┘

┌─────────────────────────────────────────────────────────────────────┐
│ 09:08 — STAGE 1: PRE-OPEN FETCH                                    │
│                                                                     │
│ BINA CODE:                                                         │
│ → NSE API se saare stocks ka data fetch kiya                      │
│ → preOpenCache mein 200+ stocks store                              │
│ → Har stock ke saath isFo, isNifty50 flags set                    │
│                                                                     │
│ CODE: getPreOpenStocks() → fetchLivePreOpenFromNSE()               │
│ TRADE: Koi trade nahi, sirf data fetch                            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ 09:15 — STAGE 1.5: PRE-SELECT                                      │
│                                                                     │
│ BINA CODE:                                                         │
│ 1. Sirf F&O stocks filter (isFo = true) → 7 stocks                │
│ 2. Conditions empty → sab pass                                     │
│ 3. Sort by changePercent ascending:                                 │
│    HINDALCO(-4.2%), TATASTEEL(-3.5%), JSWSTEEL(-2.5%)...           │
│ 4. Position #1 → HINDALCO select                                  │
│ 5. RAM Map me store → client "b364d72f" → HINDALCO                │
│                                                                     │
│ CODE: preSelectAllClients() [line 756]                              │
│ TRADE: Koi trade nahi, sirf selection                              │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ 09:15-09:20 — 5-MIN CANDLE BUILD                                   │
│                                                                     │
│ HINDALCO: 191.60 → 193.00 → 194.50 → 196.80 (HIGH) → 195.50       │
│                                                                     │
│ CODE: Koi code nahi, market mein apne aap hota hai                 │
│ TRADE: Koi trade nahi, candle banna                                │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ 09:20 — TRADE EXECUTION                                            │
│                                                                     │
│ BINA CODE:                                                         │
│ 1. Map se HINDALCO mila ✅                                         │
│ 2. Aaj ka koi trade nahi ✅                                        │
│ 3. 5-min candle high = 196.80                                      │
│ 4. Entry price = 196.80 × 1.001 = ₹196.99                         │
│ 5. LTP 200.20 >= 196.80 → BREAKOUT ✅                              │
│ 6. accessToken hai ✅                                              │
│ 7. Balance ₹8,00,000 → 1% = ₹8,000 → qty = 40                    │
│ 8. SL = ₹196.00 | Target = ₹200.02                                 │
│ 9. ORDER: BUY HINDALCO 40 LIMIT 196.99 MIS DAY                     │
│10. DB SAVE: trade = OPEN, logs = done                              │
│                                                                     │
│ CODE: executePreOpenTrades() [line 848]                             │
│ TRADE: ✅ OPEN                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ 09:20-15:15 — MONITOR (har 60 sec)                                 │
│                                                                     │
│ BINA CODE:                                                         │
│ → Har 60 sec Kite se latest price lo                               │
│ → Price >= ₹200.02? → TARGET HIT → MARKET SELL                    │
│ → Price <= ₹196.00? → STOP LOSS HIT → MARKET SELL                 │
│                                                                     │
│ SCENARIO 1 (TARGET): Price ₹201 → SELL @ 201 → P&L +₹160           │
│ SCENARIO 2 (SL):     Price ₹195 → SELL @ 196 → P&L -₹40            │
│ SCENARIO 3 (TRAIL):  Price ₹220 → SL trail to ₹219.56              │
│                      Price ₹219 → SL hit → P&L +₹902               │
│                                                                     │
│ CODE: startActiveTradesMonitoringScheduler() [line 212]             │
│ TRADE: CLOSED (profit ya loss)                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. All Conditions Detail

### Current: `conditions: []` (Empty)

```
BINA CODE: Koi condition nahi hai → saare F&O stocks pass hote hain
           → sorting ke baad #1 select hota hai

CODE: if (config.conditions && Array.isArray(config.conditions)) {
        for (const cond of config.conditions) { ... }
      }
      → Loop zero times → no filter
```

### Condition: `Pre Open Change %`

```json
{ "logical": "AND", "indicator": "Pre Open Change %", "operator": "<", "value": "-1.5" }
```

```
BINA CODE:
→ Har stock ka changePercent check karo
→ Agar changePercent < -1.5 hai tabhi pass
→ Example: HINDALCO(-4.20%) → -4.20 < -1.5? → ✅ pass
           RELIANCE(-1.20%) → -1.20 < -1.5? → ❌ reject

CODE (algoEngine.ts:800-808):
if (cond.indicator === 'Pre Open Change %') {
  const val = Number(cond.value);
  if (cond.operator === '<' && !(stock.changePercent < val)) return false;
  if (cond.operator === '>' && !(stock.changePercent > val)) return false;
  if (cond.operator === '<=' && !(stock.changePercent <= val)) return false;
  if (cond.operator === '>=' && !(stock.changePercent >= val)) return false;
}
```

### Condition: `Price Action`

```json
{ "logical": "AND", "indicator": "Price Action", "operator": ">=", "value": "Previous 5m High" }
```

```
BINA CODE:
→ stock.ltp >= stock.high hona chahiye
→ matlab stock ne apna previous high todo diya ho
→ Example: TATASTEEL (LTP=200.20, High=200.20) → 200.20 >= 200.20 → ✅ pass
           HINDALCO (LTP=191.60, High=196.80) → 191.60 >= 196.80 → ❌ reject

CODE (algoEngine.ts:809-814):
} else if (cond.indicator === 'Price Action') {
  if (cond.value === 'Previous 5m High') {
    const prevHigh = stock.high || stock.prevClose || stock.ltp;
    if (cond.operator === '>' && !(stock.ltp > prevHigh)) return false;
    if (cond.operator === '>=' && !(stock.ltp >= prevHigh)) return false;
  }
}
```

### Multiple Conditions (AND)

```
BINA CODE:
conditions array mein do conditions hain → dono true honi chahiye
1. Pre Open Change % < -1.5
2. Price Action >= Previous 5m High

Stock        change%   pass #1?  LTP vs High  pass #2?  Overall
────────────────────────────────────────────────────────────────────
HINDALCO    -4.20%    ✅        191 < 196     ❌        ❌
TATASTEEL   -3.50%    ✅        200 >= 200    ✅        ✅ ← #1
JSWSTEEL    -2.50%    ✅        785 >= 780    ✅        ✅ ← #2

CODE:
→ Dono conditions ka code sequentially run hota hai
→ Koi bhi false return kare to stock reject
```

### Bypassed Indicators (Code me nahi hai)

```
BINA CODE:
Gap Down, RSI, EMA, SMA, VWAP, MACD, SuperTrend, ADX, Volume, ATR...
→ code me inka koi handler nahi hai
→ admin form me add karega to bhi ignore hoga
→ sirf Pre Open Change % aur Price Action ka effect hota hai

CODE:
→ else if ladder mein sirf 2 indicators check hote hain
→ baaki indicators ke liye koi branch nahi → automatically skip
```

---

## 6. DB Read/Write Summary

### Queries Overview

```
08:00 → READ  app_settings, clients
      → WRITE clients (accessToken)

09:08 → WRITE app_settings (PRE_OPEN_QUOTES_DATA)

09:15 → READ  clients, strategies
      → (koi write nahi)

09:20 → READ  clients, strategies, trades
      → WRITE trades, strategy_logs, audit_logs

09:20-15:15 → READ  trades, clients, strategies (har 60 sec)
            → WRITE trades, strategy_logs, audit_logs (on exit)
```

### Detail Table

| Time | Function | Read Table | Write Table | API Call |
|---|---|---|---|---|
| 08:00 | `startDailyTokenRefreshScheduler` | `app_settings`, `clients` | `clients.accessToken` | Kite login |
| 09:08 | `fetchLivePreOpenFromNSE` | — | `app_settings` | NSE pre-open |
| 09:15 | `preSelectAllClients` | `clients`, `strategies` | — | — |
| 09:20 | `executePreOpenTrades` | `clients`, `strategies`, `trades` | `trades`, `strategy_logs`, `audit_logs` | Kite: candle, margins, placeOrder |
| 60s loop | `checkOpenTradesExits` | `trades`, `clients`, `strategies` | `trades`, `strategy_logs`, `audit_logs` | Kite: candle, placeOrder |
