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
  "tradeAction": {
    "action": "Long",
    "orderType": "Limit",
    "bufferPercent": 0.1
  },
  "stoploss": {
    "type": "Trailing SL",
    "orderType": "Market",
    "fixedPercent": 0.5,
    "trailingSL": 0.2,
    "fixedPoints": 5,
    "riskPercent": 1
  },
  "target": {
    "type": "Trailing Target",
    "profitPercent": 1.5,
    "trailingTarget": 0.5,
    "riskRewardRatio": 3,
    "partialExit": 50
  },
  "riskManagement": {
    "riskPerTrade": 1,
    "capitalAllocation": 10,
    "maxDailyLoss": 5000,
    "maxDailyProfit": 15000,
    "maxOpenPositions": 2,
    "killSwitch": false
  },
  "conditions": []
}
```

### Table: `clients` — 1 Active Client

```
id:                  b364d72f-e2e2-4dbc-bbef-3286c75e1875
zerodha_client_id:   RZJ500
capital:             ₹50,000.00
risk_percentage:     1.00%
trading_status:      active
subscription_status: active
strategy_id:         c7bafa89-...
```

### Table: `app_settings` — Algo Timings

```
algo_preopen_fetch_time → 09:08
algo_entry_time         → 09:20
algo_token_refresh_time → 08:00
algo_check_interval_sec → 60
```

### Table: `strategy_conditions` — Empty

### Table: `strategy_templates` — Empty

---

## 3. Complete Execution Flow (Step by Step with Code References)

### 08:00 — `startDailyTokenRefreshScheduler()` (line 151)

```
Har 60 sec check → currentTime === cachedRefreshTime (08:00) && lastRefreshedDate !== today?

Function: checkAndRefresh (line 161)
├── IF KITE_AUTO_LOGIN_ENABLED !== 'true' → RETURN (skip)
├── cachedRefreshTime = getAlgoSetting('algo_token_refresh_time', '08:00')
├── currentTimeStr built from IST date
├── if (currentTimeStr === cachedRefreshTime && date mismatch):
│   ├── performKiteAutoLogin(client.id)     → TOTP login
│   │   ├── client.zerodhaPassword + zerodhaTotpSecret → generate TOTP
│   │   ├── Kite login API → session token
│   │   └── DB update: client.accessToken = new token
│   └── lastRefreshedDate = currentDateKey
└── setInterval(checkAndRefresh, 60 * 1000)
```

**DB Read:** `app_settings` (algo_token_refresh_time), `clients` (zerodhaPassword, zerodhaTotpSecret)
**DB Write:** `clients.accessToken`

---

### 09:08 — `startDailyPreOpenStrategyScheduler()` — Stage 1 (line 80)

```
Same setInterval, har 60 sec:

Stage 1 → currentTime === cachedFetchTime (09:08) && lastFetchedDate !== today?

Function: getPreOpenStocks() (line 1477)
├── IF preOpenCache empty OR date expired → fetchLivePreOpenFromNSE()
│   └── RETURN preOpenCache
│
└── fetchLivePreOpenFromNSE() (line 1349)
    ├── NSE API: GET nseindia.com/api/market-data-pre-open
    │   ├── Cookies set from NSE homepage (line 1359)
    │   ├── Also fetch NIFTY, BANKNIFTY, FO, SME index members (line 1379-1384)
    │   └── Parse response → StockQuote[] array
    ├── For each stock set: isNifty50, isBankNifty, isFo, isSme flags
    ├── preOpenCache = freshStocks
    ├── WebSocket re-subscribe to new symbols (line 1451-1463)
    └── RETURN freshStocks

DB Write: app_settings (PRE_OPEN_QUOTES_DATA) ← stores full JSON
```

---

### 09:15 — `startDailyPreOpenStrategyScheduler()` — Stage 1.5 (line 124)

```
Stage 1.5 → currentTime === cachedPreSelectTime (09:15)

cachedPreSelectTime = strategy.configJson.basicInfo.preSelectTime (line 105)

Function: preSelectAllClients() (line 756)
├── preOpenStocks = preOpenCache (stage 1 se already fetch)
├── clients = prisma.client.findMany({
│     where: { tradingStatus:'active', subscriptionStatus:'active', strategyId: not null },
│     include: { user, strategy }
│   })
├── preselectedForClient.clear()                ← Map reset
│
├── FOR each client:
│   ├── strategy = client.strategy
│   ├── IF strategy.status !== 'active' → SKIP
│   ├── config = JSON.parse(strategy.configJson)
│   │
│   ├── SEGMENT FILTER (line 791-798):
│   │   ├── IF segment === 'NSE F&O' | 'Futures' | 'Options':
│   │   │   → stock.isFo === false? → EXCLUDE
│   │   ├── IF segment === 'Nifty 50' | 'Nifty':
│   │   │   → stock.isNifty50 === false? → EXCLUDE
│   │   └── IF segment === 'Bank Nifty' | 'BankNifty':
│   │       → stock.isBankNifty === false? → EXCLUDE
│   │
│   ├── CONDITIONS FILTER (line 799-816):
│   │   ├── IF conditions array is empty → ALL PASS
│   │   ├── IF condition.indicator === 'Pre Open Change %':
│   │   │   → Compare stock.changePercent with cond.value
│   │   │   → Operators: < > <= >= === ==
│   │   └── IF condition.indicator === 'Price Action':
│   │       → Compare stock.ltp with stock.high/prevClose
│   │       → Operators: > >=
│   │
│   ├── IF matchingStocks.length === 0 → SKIP (log)
│   │
│   ├── SORT (line 828-830):
│   │   ├── Action = 'Long' → ascending by changePercent (most negative first)
│   │   └── Action = 'Short' → descending by changePercent (most positive first)
│   │
│   ├── PICK (line 837):
│   │   selectPosition = config.basicInfo.selectPosition || 1
│   │   candidateStock = sortedStocks[selectPosition - 1]
│   │
│   └── STORE (line 838):
│       preselectedForClient.set(client.id, candidateStock)
│       → In-memory Map me store (RAM me, DB nahi)
│
└── Console: "X/Y clients have a preselected stock ready"
```

---

### 09:15 to 09:20 — 5-Minute Candle

```
Market opens at 09:15. 5-minute candles bante hain:

09:15-09:20 → Candle 1: [open, high, low, close]
```

---

### 09:20 — `executePreOpenTrades()` — Stage 2 (line 848)

```
Function: executePreOpenTrades(adminId) (line 848)
│
├── preOpenStocks = getPreOpenStocks() (line 852-854)
├── clients = prisma.client.findMany({...})
│
├── FOR each client (line 895):
│   ├── strategy = client.strategy
│   ├── IF strategy.status !== 'active' → SKIP
│   ├── config = JSON.parse(strategy.configJson)
│   │
│   ├── [STEP 1] PRESELECTED MAP CHECK (line 909-910):
│   │   candidateStock = preselectedForClient.get(client.id)
│   │   preselectedForClient.delete(client.id)   ← consumed!
│   │   IF candidateStock === null:
│   │   │   → Fallback: full filter + sort + rank (same logic as Stage 1.5)
│   │
│   ├── [STEP 2] EXISTING TRADE CHECK (line 975-986):
│   │   trade = prisma.trade.findFirst({
│   │     where: { clientId, strategyId, symbol, createdAt: { gte: today } }
│   │   })
│   │   IF trade exists → SKIP (already traded today)
│   │
│   ├── [STEP 3] 5-MIN CANDLE FETCH (line 990-1005):
│   │   KiteClient.getHistoricalData(apiKey, accessToken, token, "5minute", from, to)
│   │   candleHigh = res.data.candles[0][2]     ← 1 candle ka high
│   │   IF candleHigh === 0:
│   │     candleHigh = stock.high || stock.ltp || prevClose || 100
│   │
│   ├── [STEP 4] ENTRY PRICE (line 1011-1012):
│   │   entryPrice = candleHigh × (1 + bufferPercent / 100)
│   │
│   ├── [STEP 5] BREAKOUT CHECK (line 1014-1025):
│   │   hasPriceAction = conditions.some(c => c.indicator === 'Price Action')
│   │   IF !hasPriceAction OR currentLtp >= candleHigh → BREAKOUT ✅
│   │   ELSE → BREAKOUT NOT MET ❌ → SKIP
│   │
│   ├── [STEP 6] KITE SESSION (line 1037-1108):
│   │   IF !accessToken AND auto-login possible → performKiteAutoLogin()
│   │   IF !accessToken → FAILED trade → SKIP
│   │
│   ├── [STEP 7] POSITION SIZING (line 1110-1163):
│   │   liveBalance = Kite.getMargins() (or DB client.capital fallback)
│   │   allocatedAmount = liveBalance × riskPerTrade / 100
│   │   Cap by client.capital
│   │   qty = floor(allocatedAmount / entryPrice)
│   │
│   ├── [STEP 8] SL & TARGET (line 1169-1190):
│   │   SL = entryPrice × (1 - slPercent/100)
│   │   Target = entryPrice × (1 + targetPercent/100)
│   │
│   ├── [STEP 9] PLACE ORDER (line 1198-1298):
│   │   KiteClient.placeOrder({ exchange, tradingsymbol, BUY, qty, LIMIT, MIS, ... })
│   │
│   ├── [STEP 10] SAVE TRADE (line 1301-1315): DB WRITE
│   │   prisma.trade.create({ clientId, strategyId, symbol, entryPrice, qty, ... })
│   │
│   └── [STEP 11] LOGS (line 1317-1336): DB WRITE
│       prisma.strategyLog.create({...})
│       prisma.auditLog.create({...})
```

---

### 09:20 to 15:15 — `startActiveTradesMonitoringScheduler()` (line 212)

```
Har 60 sec:

Function: checkOpenTradesExits (line 219)
├── openTrades = prisma.trade.findMany({ where: { status: 'open' } })
│
├── FOR each trade:
│   ├── config = JSON.parse(strategy.configJson)
│   ├── KiteClient.getHistoricalData(apiKey, token, interval, from, to)
│   │   → latestCandle = candles[candles.length - 1]
│   │   → currentPrice = latestCandle[4] (close)
│   │
│   ├── IF currentPrice <= SL → MARKET SELL (Stop Loss hit)
│   ├── IF currentPrice >= Target → MARKET SELL (Target hit)
│   │
│   └── prisma.trade.update({ status:'closed', exitPrice, pnl })
│       prisma.strategyLog.create({...})
│       prisma.auditLog.create({...})
│
└── setInterval(checkOpenTradesExits, 60 * 1000)
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
│ getPreOpenStocks() → fetchLivePreOpenFromNSE()                      │
│   → NSE API se 200+ stocks ka data fetch                           │
│   → preOpenCache[] me store                                         │
│   → PRE_OPEN_QUOTES_DATA app_setting me save                        │
│   → Har stock me flags set: isFo=true/false, isNifty50, etc.        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ 09:15 — STAGE 1.5: PRE-SELECT STOCK                                │
│                                                                     │
│ preSelectAllClients() [algoEngine.ts:756]                           │
│                                                                     │
│ Step A: preOpenStocks = preOpenCache (already fetched)              │
│                                                                     │
│ Step B: clients = prisma.client.findMany(where active)             │
│         → 1 client: RZJ500 (b364d72f)                               │
│                                                                     │
│ Step C: strategy = c7bafa89 (Pre Open Momentum Breakout)            │
│         config = JSON.parse(strategy.configJson)                    │
│                                                                     │
│ Step D: SEGMENT FILTER [line 791-798]                              │
│         segment = "NSE F&O"                                         │
│         → stocks.filter(s => s.isFo === true)                       │
│         → 7 stocks pass (HINDALCO, TATASTEEL, JSWSTEEL,             │
│           BHARTIARTL, RELIANCE, HDFCBANK, SBIN)                     │
│                                                                     │
│ Step E: CONDITIONS FILTER [line 799-816]                           │
│         conditions = []                                             │
│         → koi filter nahi → ALL 7 F&O stocks pass                   │
│                                                                     │
│ Step F: SORT [line 828-830]                                        │
│         action = "Long" → ascending by changePercent                │
│         1. HINDALCO    -4.20%  ← sortedStocks[0]                   │
│         2. TATASTEEL   -3.50%  ← sortedStocks[1]                   │
│         3. JSWSTEEL    -2.50%  ← sortedStocks[2]                   │
│         4. BHARTIARTL  -1.80%  ← sortedStocks[3]                   │
│         5. RELIANCE    -1.20%  ← sortedStocks[4]                   │
│         6. HDFCBANK    -0.62%  ← sortedStocks[5]                   │
│         7. SBIN        -0.33%  ← sortedStocks[6]                   │
│                                                                     │
│ Step G: PICK POSITION #1 [line 837]                                │
│         selectPosition = 1                                          │
│         candidateStock = sortedStocks[0] = HINDALCO                 │
│                                                                     │
│ Step H: STORE IN MAP [line 838]                                    │
│         preselectedForClient.set("b364d72f", HINDALCO stock data)  │
│         → RAM me store, DB nahi                                     │
│                                                                     │
│ Console: "RZJ500 → #1 HINDALCO(-4.20%)"                            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ 09:15 to 09:20 — MARKET OPEN + 5-MIN CANDLE BUILD                  │
│                                                                     │
│ HINDALCO live trading:                                              │
│   09:15:00 → ₹191.60 (open)                                        │
│   09:16:00 → ₹193.00                                                │
│   09:17:00 → ₹194.50                                                │
│   09:18:00 → ₹196.80 ← HIGH                                       │
│   09:19:00 → ₹195.50                                                │
│   09:20:00 → ₹200.20 ← current LTP                                │
│                                                                     │
│ 5-min candle: [191.60, 196.80, 191.00, 195.50]                    │
│              [open,   HIGH,  low,    close]                        │
│                                                                     │
│ candleHigh = 196.80                                                 │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ 09:20 — STAGE 2: TRADE EXECUTION                                   │
│                                                                     │
│ executePreOpenTrades('system-scheduler') [algoEngine.ts:848]       │
│                                                                     │
│ FOR CLIENT RZJ500:                                                  │
│                                                                     │
│ [STEP 1] Map Check [line 909]                                      │
│   → preselectedForClient.get("b364d72f") = HINDALCO ✅             │
│   → Map se delete (consumed)                                        │
│                                                                     │
│ [STEP 2] Existing Trade Check [line 976-986]                       │
│   → prisma.trade.findFirst({ clientId, strategyId,                 │
│       symbol: 'HINDALCO', createdAt >= today })                     │
│   → No trade found → CONTINUE ✅                                    │
│                                                                     │
│ [STEP 3] 5-Min Candle Fetch [line 990-1005]                        │
│   → instTokenStr = 12345 (from instrumentToSymbol Map)              │
│   → KiteClient.getHistoricalData(apiKey, token,                     │
│       "5minute", "2026-06-19%2009:15", "2026-06-19%2009:20")       │
│   → Response: [[..., 191.60, 196.80, 191.00, 195.50, ...]]         │
│   → candleHigh = Number(response.data.candles[0][2]) = 196.80     │
│                                                                     │
│ [STEP 4] Entry Price [line 1011-1012]                              │
│   → bufferPercent = 0.1                                             │
│   → entryPrice = 196.80 × (1 + 0.1/100) = 196.80 × 1.001          │
│   → entryPrice = ₹196.99                                            │
│                                                                     │
│ [STEP 5] Breakout Check [line 1014-1025]                           │
│   → currentLTP = 200.20 (Kite live price)                           │
│   → hasPriceAction = false (conditions empty)                       │
│   → !hasPriceAction = true → BREAKOUT CONFIRMED ✅                 │
│   → targetStock = HINDALCO                                          │
│   Console: "Breakout confirmed for HINDALCO |                       │
│     Candle High: 196.80 | LTP: 200.20 | Entry: 196.99"             │
│                                                                     │
│ [STEP 6] Kite Session [line 1037-1108]                             │
│   → client.accessToken = "abc123..." (exists) ✅                   │
│                                                                     │
│ [STEP 7] Position Sizing [line 1110-1163]                          │
│   → KiteClient.getMargins() → net equity = ₹8,00,000               │
│   → riskPerTrade = 1%                                               │
│   → allocatedAmount = 800000 × 1/100 = ₹8,000                      │
│   → dbCapitalLimit = client.capital = ₹50,000                       │
│   → allocatedAmount = min(8000, 50000) = ₹8,000                    │
│   → qty = floor(8000 / 196.99) = 40 shares                        │
│                                                                     │
│ [STEP 8] SL & Target [line 1169-1190]                              │
│   → slPercent = 0.5%                                                │
│   → targetPercent = 1.5%                                            │
│   → SL = 196.99 × 0.995 = ₹196.00                                   │
│   → Target = 196.99 × 1.015 = ₹200.02                               │
│   → orderType = 'Limit' → LIMIT order at ₹196.99                    │
│                                                                     │
│ [STEP 9] Place Order [line 1198-1298]                              │
│   → KiteClient.placeOrder({                                        │
│       exchange: 'NSE',                                              │
│       tradingsymbol: 'HINDALCO',                                    │
│       transaction_type: 'BUY',                                      │
│       quantity: 40,                                                  │
│       order_type: 'LIMIT',                                          │
│       product: 'MIS',                                               │
│       validity: 'DAY',                                              │
│       price: 196.99                                                 │
│     })                                                              │
│   → Response: { status: 'success', data: { order_id: '240619...' }}│
│   → orderId = '240619000123456'                                    │
│                                                                     │
│ [STEP 10] Save Trade [line 1301-1315] (DB WRITE)                   │
│   → prisma.trade.create({                                          │
│       clientId: 'b364d72f...',                                      │
│       strategyId: 'c7bafa89...',                                    │
│       symbol: 'HINDALCO',                                           │
│       orderType: 'MIS',                                             │
│       entryPrice: 196.99,                                           │
│       quantity: 40,                                                  │
│       stopLoss: 196.00,                                             │
│       target: 200.02,                                               │
│       status: 'OPEN',                                               │
│       entryTime: new Date(),                                        │
│       kiteResponse: { order_id: '240619000123456' }                 │
│     })                                                              │
│                                                                     │
│ [STEP 11] Logs [line 1317-1336] (DB WRITE)                         │
│   → prisma.strategyLog.create({...})                                │
│   → prisma.auditLog.create({...})                                   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ 09:20 to 15:15 — MONITORING (har 60 sec)                           │
│                                                                     │
│ startActiveTradesMonitoringScheduler() [line 212]                   │
│                                                                     │
│ Check 1 — 09:21:00:                                                 │
│   Trade: HINDALCO | Entry: 196.99 | Current: ₹201.00                │
│   SL: 196.00 | Target: 200.02                                       │
│   → 201.00 >= 200.02? → YES → TARGET HIT ✅                        │
│   → MARKET SELL 40 HINDALCO @ 201.00                                │
│   → P&L = (201.00 - 196.99) × 40 = ₹160.40                         │
│   → Trade status: 'closed'                                          │
│   → Strategy Log: "Intraday Trade Closed for RZJ500:               │
│     Sold 40 shares of HINDALCO at exit price ₹201.00                │
│     due to Target (1.5%) hit. Total P&L: ₹160.40"                   │
│                                                                     │
│ Scenario 2 — Agar price girta:                                      │
│   Check 5 — 10:30:00:                                                │
│     Trade: HINDALCO | Current: ₹195.50                               │
│     SL: 196.00 → 195.50 <= 196.00? → STOP LOSS HIT 🔴              │
│     P&L = (196.00 - 196.99) × 40 = -₹39.60                          │
│                                                                     │
│ Scenario 3 — Trailing SL active:                                     │
│   Price ₹210 → SL trails to ₹209.58 (210 × 0.998)                   │
│   Price ₹220 → SL trails to ₹219.56 (220 × 0.998)                   │
│   Price drops to ₹219 → 219 <= 219.56? → YES → SL HIT              │
│   P&L = (219.56 - 196.99) × 40 = ₹902.80                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. All Conditions — Detail

### Current: `conditions: []` (Empty — No Filter)

```
Saare F&O stocks pass → sabse zyada gira hua select → trade
```

### Condition 1: `Pre Open Change %`

```json
{ "logical": "AND", "indicator": "Pre Open Change %", "operator": "<", "value": "-1.5" }
```

| Field | Meaning | Possible Values |
|---|---|---|
| `logical` | Multiple conditions ka AND/OR | `AND` |
| `indicator` | Kaunsa indicator | `Pre Open Change %` |
| `operator` | Comparison | `<`, `>`, `<=`, `>=`, `===`, `==` |
| `value` | Threshold | Any number (e.g. `-1.5`, `0`, `2`) |

**Code:** `algoEngine.ts:800-808`
```javascript
if (cond.indicator === 'Pre Open Change %') {
  const val = Number(cond.value);
  if (cond.operator === '<' && !(stock.changePercent < val)) return false;
  if (cond.operator === '>' && !(stock.changePercent > val)) return false;
  // ...
}
```

**Example:** `Pre Open Change % < -1.5`
```
Stock        changePercent    Pass?
─────────────────────────────────────
HINDALCO        -4.20%        ✅
TATASTEEL       -3.50%        ✅
JSWSTEEL        -2.50%        ✅
BHARTIARTL      -1.80%        ✅
RELIANCE        -1.20%        ❌
HDFCBANK        -0.62%        ❌
SBIN            -0.33%        ❌
ICICIBANK       +0.30%        ❌
```

### Condition 2: `Price Action`

```json
{ "logical": "AND", "indicator": "Price Action", "operator": ">=", "value": "Previous 5m High" }
```

| Field | Meaning | Possible Values |
|---|---|---|
| `indicator` | Kaunsa indicator | `Price Action` |
| `operator` | Comparison | `>`, `>=` |
| `value` | Compare kiske saath | `Previous 5m High` (fixed) |

**Code:** `algoEngine.ts:809-814`
```javascript
} else if (cond.indicator === 'Price Action') {
  if (cond.value === 'Previous 5m High') {
    const prevHigh = stock.high || stock.prevClose || stock.ltp;
    if (cond.operator === '>' && !(stock.ltp > prevHigh)) return false;
    if (cond.operator === '>=' && !(stock.ltp >= prevHigh)) return false;
  }
}
```

### Multiple Conditions — AND Logic

```json
"conditions": [
  { "logical": "AND", "indicator": "Pre Open Change %", "operator": "<", "value": "-1.5" },
  { "logical": "AND", "indicator": "Price Action", "operator": ">=", "value": "Previous 5m High" }
]
```

```
F&O filter → Pre Open Change % < -1.5 → Price Action >= Prev High
→ dono true? → pass → sorted → pick position #1
```

```
Stock        change%  LTP   High   Pass PreChange?  Pass PriceAction?  Result
──────────────────────────────────────────────────────────────────────────────
HINDALCO    -4.20%  191.60 196.80  ✅                ❌                 ❌
TATASTEEL   -3.50%  200.20 200.20  ✅                ✅                 ✅ ← #1
JSWSTEEL    -2.50%  785.00 780.00  ✅                ✅                 ✅ ← #2
```

### Bypassed Indicators (Code me handler nahi hai — ignore hote hain)

```
Gap Down, RSI, EMA, SMA, VWAP, MACD, SuperTrend, ADX,
Volume, Open Interest, Previous High/Low/Close, Gap Up,
Pre Open Price, Pre Open Volume, ATR, Bollinger Bands
```

Agar admin form me yeh indicators add karega, code unhe **ignore karega** (skip, error nahi). Sirf **Pre Open Change %** aur **Price Action** ka actual effect hoga.

---

## 6. DB Read/Write Summary

### DB Reads (Prisma Queries)

| Function | Table | When |
|---|---|---|
| `getAlgoSetting()` | `app_settings` | Har 60 sec (scheduler) |
| `preSelectAllClients()` | `clients`, `strategies` | 09:15 once |
| `executePreOpenTrades()` | `clients`, `strategies`, `trades` | 09:20 once |
| `startActiveTradesMonitoringScheduler()` | `trades`, `clients`, `strategies` | Har 60 sec |

### DB Writes (Prisma Queries)

| Function | Table | When |
|---|---|---|
| `fetchLivePreOpenFromNSE()` | `app_settings` (PRE_OPEN_QUOTES_DATA) | 09:08 once |
| `performKiteAutoLogin()` | `clients` (accessToken) | 08:00 (if enabled) |
| `executePreOpenTrades()` | `trades`, `strategy_logs`, `audit_logs` | 09:20 |
| `startActiveTradesMonitoringScheduler()` | `trades`, `strategy_logs`, `audit_logs` | On SL/Target hit |

### Kite API Calls

| API | When |
|---|---|
| `getHistoricalData("5minute")` | 09:20 + har 60 sec monitor |
| `getMargins()` | 09:20 (position sizing) |
| `placeOrder()` | 09:20 + SL/Target hit |
| `performKiteAutoLogin()` | 08:00 (if needed) |
