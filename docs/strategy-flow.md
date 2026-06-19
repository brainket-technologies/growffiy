# Pre-Open Momentum Breakout — Pura Flow (Neon DB Real Data)

> **Last Updated:** 20 June 2026
> **Data Source:** Neon PostgreSQL (live production DB)
> **Strategy:** "Pre-Open Momentum Breakout" — 1 strategy, 1 client (Vikash Sharma), 0 conditions

---

## 1. Database Schema (Strategy-Related)

**File:** `prisma/schema.prisma`

### `Strategy` (`strategies` table)

| Column | Type | Example (DB) |
|--------|------|-------------|
| `id` | UUID (PK) | `c7bafa89-3403-44c3-bcd0-199602c878e1` |
| `name` | String | `"Pre-Open Momentum Breakout"` |
| `description` | String? | `"Pre-Open Momentum Breakout Strategy"` |
| `status` | String | `"active"` |
| `configJson` | String (TEXT) | **Poora config JSON** — entry/exit/risk/conditions sab |
| `createdAt` | DateTime | `2026-06-16T12:59:09.893Z` |
| `updatedAt` | DateTime | `2026-06-19T18:17:21.495Z` |

### `StrategyCondition` (`strategy_conditions` table)

| Column | Type |
|--------|------|
| `id` | UUID (PK) |
| `strategyId` | FK → Strategy.id (cascade delete) |
| `logical` | String (`"AND"` / `"OR"`) |
| `indicator` | String (e.g. `"RSI"`, `"Pre Open Change %"`) |
| `operator` | String (`>`, `<`, `>=`, `<=`) |
| `value` | String (threshold) |

### `StrategyAssignment` — client ↔ strategy mapping
### `StrategyLog` — strategy ke logs
### `StrategyBacktest` — backtest results
### `Client` — has `strategyId` FK → Strategy

**Key relation:** `Strategy` 1→N `StrategyCondition`, `Strategy` 1→N `Client` (via `strategyId`)

---

## 2. Actual Neon DB Data (20 June 2026)

### 2.1 Strategy (1 record)

```json
{
  "id": "c7bafa89-3403-44c3-bcd0-199602c878e1",
  "name": "Pre-Open Momentum Breakout",
  "status": "active",
  "configJson": {
    "basicInfo": {
      "name": "Pre-Open Momentum Breakout",
      "status": "active",
      "segment": "NSE F&O",
      "exchange": "NSE",
      "entryTime": "09:20",
      "preSelectTime": "09:15",
      "selectPosition": 1,
      "tradeType": "Intraday",
      "timeframe": "5m",
      "checkIntervalSec": 60,
      "description": "Pre-Open Momentum Breakout Strategy",
      "exitTime": "15:25"
    },
    "stoploss": {
      "type": "Trailing SL",
      "orderType": "Market",
      "fixedPercent": 1,
      "fixedPoints": 10,
      "trailingSL": -1,
      "riskPercent": 1
    },
    "target": {
      "type": "Trailing Target",
      "profitPercent": 2,
      "riskRewardRatio": 2,
      "partialExit": 100,
      "trailingTarget": -1
    },
    "tradeAction": {
      "action": "Long",
      "orderType": "SL-Market",
      "bufferPercent": 0.1,
      "candlePriceType": "high"
    },
    "riskManagement": {
      "riskPerTrade": 3,
      "killSwitch": false,
      "maxOpenPositions": 3,
      "maxDailyLoss": 5000,
      "maxDailyProfit": 15000,
      "capitalAllocation": 10,
      "misMarginRate": -1
    },
    "conditions": []
  }
}
```

### 2.2 Client (1 record — Vikash Sharma)

| Field | Value |
|-------|-------|
| **User Name** | Vikash sharma |
| **Email** | vikash@gmail.com |
| **Zerodha Client ID** | RZJ500 |
| **Capital** | ₹50,000 (DB cap) |
| **tradingStatus** | `"active"` |
| **subscriptionStatus** | `"active"` |
| **strategyId** | ✅ Assigned to strategy above |
| **Kite API Key** | `4y7j026qyv9lkacw` |
| **Access Token** | `QZznO9xZaRkem3dPG9dm8iz9Zq2S82Io` |
| **Password** | `987654321` |
| **TOTP Secret** | `JT5PXX4UOZZYNHTV7X525T6QSA4QNQDQ` |
| **kycStatus** | `"verified"` |
| **Zerodha Session** | Valid (last login: 19 Jun 08:00:12) |

### 2.3 Failed Trades (Real History)

| Date | Stock | Qty | Status | Error Message |
|------|-------|:---:|:------:|--------------|
| 19 Jun | **MPHASIS** | 0 | FAILED | `Calculated quantity is 0 (Allocated amount ₹854.90 is less than entry price ₹3040.24).` |
| 18 Jun | **INFY** | 87 | FAILED | `Incorrect api_key or access_token.` (TokenException) |
| 17 Jun | **TATASTEEL** | 7 | FAILED | `Our order management system is under scheduled maintenance. Try placing your AMO order after 5.30 AM.` |
| 17 Jun | Multiple | — | FAILED | `Market orders without market protection are not allowed via API.` |
| 17 Jun | Multiple | — | FAILED | `IP (xxx) is not allowed to place orders for this app.` |

### 2.4 App Settings (Global Timings)

| Key | Value |
|-----|:-----:|
| `algo_preopen_fetch_time` | 09:08 |
| `algo_entry_time` | 09:20 |
| `algo_token_refresh_time` | 08:00 |
| `algo_check_interval_sec` | 60 |
| `isTradingActive` | `true` |

---

## 3. Conditions Analysis — Abhi Kya Hai

### Current State: `conditions: []` (Empty)

**File:** `algoEngine.ts:100-199`

```typescript
private async matchesConditions(stock, conditions, client) {
  if (!conditions || !Array.isArray(conditions) || conditions.length === 0)
    return true;  // ← SAB PASS ✅
  // ... condition checking loop
}
```

**Kya hota hai empty conditions se?**
- Engine `preSelectAllClients()` aur `executePreOpenTrades()` dono mey `matchesConditions()` call karta hai
- Array empty → function immediately `return true`
- **Sirf segment filter lagta hai** (NSE F&O → `stock.isFo === true`)
- Phir direct sort + selectPosition

### Agar Conditions Add Karein to Kya Hoga

**File:** `algoEngine.ts:100-199` — `matchesConditions()` method

| Indicator | Code Check | File:Line | Kya Compare Hota Hai |
|-----------|-----------|-----------|---------------------|
| **Pre Open Change %** | `stock.changePercent < val` | `algoEngine.ts:104-109` | NSE pre-open data ka changePercent |
| **Price Action** | `stock.ltp >= prevHigh` | `algoEngine.ts:110-115` | LTP vs 5-min candle high/prevClose |
| **Gap Up** | `(iep - prevClose)/prevClose * 100 > val` | `algoEngine.ts:116-118` | IEP vs previous close % |
| **Gap Down** | `(iep - prevClose)/prevClose * 100 < -val` | `algoEngine.ts:119-121` | IEP vs previous close % (negative) |
| **Previous High** | `stock.ltp > 52wHigh` | `algoEngine.ts:122-123` | LTP vs 52-week high |
| **Previous Low** | `stock.ltp < 52wLow` | `algoEngine.ts:124-125` | LTP vs 52-week low |
| **Previous Close** | `stock.ltp > prevClose` | `algoEngine.ts:126-127` | LTP vs previous close |
| **Pre Open Price** | `stock.ltp > iep` | `algoEngine.ts:128-129` | LTP vs IEP (pre-open price) |
| **Pre Open Volume** | `finalQuantity > val` | `algoEngine.ts:130-131` | Pre-open volume vs threshold |
| **Volume** | `stock.volume > val` | `algoEngine.ts:132-133` | Live volume vs threshold |
| **Open Interest** | `openInterest > val` | `algoEngine.ts:134-135` | OI vs threshold |
| **RSI** | `calculateRSI(candles, 14) > val` | `algoEngine.ts:141-143` | RSI from 5min candles |
| **EMA** | `calculateEMA(candles, period) > val` | `algoEngine.ts:144-149` | EMA vs SMA or value |
| **SMA** | `calculateSMA(candles, period) > val` | `algoEngine.ts:150-153` | SMA vs value |
| **VWAP** | `stock.ltp > VWAP` | `algoEngine.ts:154-156` | LTP vs VWAP from candles |
| **MACD** | `MACD.line > Signal.line` | `algoEngine.ts:157-160` | MACD vs Signal line |
| **ATR** | `ATR > val` | `algoEngine.ts:161-164` | ATR from candles |
| **Bollinger Bands** | `LTP > UpperBand` | `algoEngine.ts:165-169` | LTP vs Upper/Lower/Middle band |
| **SuperTrend** | `direction === 'up'` | `algoEngine.ts:170-174` | SuperTrend direction + value |
| **ADX** | `ADX > val` | `algoEngine.ts:175-177` | ADX from candles |
| **Candle Pattern** | Doji/Engulfing/Hammer check | `algoEngine.ts:178-194` | Last 2 candles body/wick check |

### Example: Kaise Filter Hoga With Conditions

**Condition added:** `Pre Open Change % < -1.5`

**Pre-open data sample (actual NSE data):**

| Stock | changePercent | isFo | Pass? |
|-------|:------------:|:----:|:-----:|
| MPHASIS | -1.2% | ✅ | ❌ (-1.2 > -1.5) |
| TATASTEEL | -2.1% | ✅ | ✅ |
| SBIN | -1.8% | ✅ | ✅ |
| HDFCBANK | -0.5% | ✅ | ❌ |
| INFY | +0.3% | ✅ | ❌ |
| RELIANCE | +0.8% | ✅ | ❌ |

**Pass karne wale:** TATASTEEL (-2.1%), SBIN (-1.8%)
**Sort (Long):** TATASTEEL first (-2.1% < -1.8%)
**selectPosition=1 → TATASTEEL selected**

### Example: 2 Conditions (AND)

```
Pre Open Change % < -1.5   AND   RSI < 30
```

Engine check karega (algoEngine.ts:101-102):
```typescript
for (const cond of conditions) {
  // condition 1: Pre Open Change %
  if (!(stock.changePercent < -1.5)) return false;

  // condition 2: RSI (needs Kite API candle data)
  const candles = await fetchHistoricalCandles(client, symbol, '5minute', 5);
  const rsi = calculateRSI(candles, 14);
  if (!(rsi < 30)) return false;
}
```

Agar ek bhi condition fail → stock reject. Dono pass → eligible.

---

## 4. Complete Flow — Real Client Vikash Sharma (RZJ500)

### ⏰ 08:00 — Token Refresh (Global Scheduler)

**File:** `algoEngine.ts:273-332`

```
KITE_AUTO_LOGIN_ENABLED = "true" ✅

Engine dhoondta hai:
  prisma.client.findMany({
    where: {
      tradingStatus: 'active',
      subscriptionStatus: 'active',
      zerodhaPassword: { not: null },
      zerodhaTotpSecret: { not: null },
      zerodhaClientId: { not: null }
    }
  })

→ Vikash mil gaya ✅ (RZJ500, password+TOTP exist)
→ performKiteAutoLogin(client.id) called:
    TOTP generate → Zerodha login → naya accessToken
→ DB update: client.accessToken = "QZznO9xZaRkem3dPG9dm8iz9Zq2S82Io"
→ Vikash ka session refresh ho gaya ✅
```

### ⏰ 09:08 — Pre-Open Data Fetch (Global Scheduler)

**File:** `algoEngine.ts:225-229`

```
currentTime === "09:08" && lastFetchedDate !== today

→ getPreOpenStocks() called
→ NSE API se 200+ stocks ka pre-open data fetch
→ Stored in:
  1. this.preOpenCache[] (RAM — fast access)
  2. PRE_OPEN_QUOTES_DATA (DB app_settings — backup)
```

**Example stocks from actual DB cache:**

| Symbol | Change% | isFo | LTP |
|--------|:-------:|:----:|:---:|
| MPHASIS | -1.2% | ✅ | ₹3,040 |
| INFY | +0.3% | ✅ | ₹1,143 |
| TATASTEEL | -2.1% | ✅ | ₹198 |
| SBIN | -1.8% | ✅ | ₹600 |
| RELIANCE | +0.8% | ✅ | ₹2,470 |
| HDFCBANK | -0.5% | ✅ | ₹1,590 |

### ⏰ 09:15 — preSelectTime → Stock Selection

**File:** `algoEngine.ts:232-250`

```
Scheduler har 60 sec chalta hai. currentTime === "09:15"

→ prisma.strategy.findMany({ where: { status: 'active' } })
→ "Pre-Open Momentum Breakout" mila ✅
→ config = JSON.parse(strategy.configJson)
→ basicInfo.preSelectTime = "09:15" → MATCH ✅

→ preSelectAllClients(strategy.id) called
```

**Inside `preSelectAllClients()` (algoEngine.ts:1068-1170):**

```
Step 1: Vikash ka client record load
  prisma.client.findMany({
    where: { tradingStatus: 'active', subscriptionStatus: 'active', strategyId }
  })
  → Vikash mila ✅

Step 2: Strategy config parse
  segment = "NSE F&O"
  action = "Long"
  selectPosition = 1

Step 3: SEGMENT FILTER (algoEngine.ts:1122-1131)
  preOpenStocks.filter(stock => stock.isFo === true)
  → MPHASIS, INFY, TATASTEEL, SBIN, RELIANCE, HDFCBANK — sab F&O stocks

Step 4: CONDITIONS FILTER (algoEngine.ts:1141)
  config.conditions = [] (empty)
  → matchesConditions() returns true for ALL stocks ✅
  → Koi extra filter nahi laga

Step 5: SORT (algoEngine.ts:1151-1153)
  action === 'Long' → ascending by changePercent
  (sabse zyada negative pehle)

  Rank | Stock       | Change%
  -----|-------------|:------:
   1   | TATASTEEL   | -2.1%   ← sortedStocks[0] 🎯
   2   | SBIN        | -1.8%
   3   | MPHASIS     | -1.2%
   4   | HDFCBANK    | -0.5%
   5   | INFY        | +0.3%
   6   | RELIANCE    | +0.8%

Step 6: PICK POSITION (algoEngine.ts:1155-1160)
  selectPosition = 1 → sortedStocks[0]
  → TATASTEEL selected ✅

Step 7: STORE IN MAP
  preselectedForClient.set("b364d72f...", TATASTEEL stock data)
  subscribeSymbols(["TATASTEEL"])  → WebSocket subscription
```

### ⏰ 09:15-09:20 — 5-Min Candle Build

```
Market opens at 09:15. TATASTEEL ki 5-min candle:

Time      Price
───────────────
09:15     ₹198.00  ← open
09:16     ₹198.10
09:17     ₹197.50  ← LOW = 197.50
09:18     ₹199.20  ← HIGH = 199.20
09:19     ₹198.80
09:20     ₹200.00  ← current LTP

Candle: [open=198.00, HIGH=199.20, low=197.50, close=198.80]
```

### ⏰ 09:20 — entryTime → Trade Execution

**File:** `algoEngine.ts:253-262`

```
currentTime === "09:20" → MATCH ✅
→ executePreOpenTrades(adminId, undefined, strategy.id)
```

**Inside `executePreOpenTrades()` (algoEngine.ts:1172- onwards):**

```
Step 1: PRE-SELECTED STOCK (line 1248)
  preselectedForClient.get("b364d72f...")
  → TATASTEEL ✅
  → Map se delete (ek baar use kiya)

Step 2: EXISTING TRADE CHECK (line 1303-1314)
  prisma.trade.findFirst({
    where: { clientId, strategyId, symbol: "TATASTEEL", createdAt >= today }
  })
  → Nahi mila → continue ✅

Step 3: 5-MIN CANDLE FETCH (line 1321-1336)
  Vikash ke Kite API se candle data:
  → candleHigh = 199.20

Step 4: ENTRY PRICE (line 1343-1348)
  bufferPercent = 0.1% (from config)
  entryPrice = 199.20 × (1 + 0.1/100) = 199.20 × 1.001 = ₹199.40

Step 5: BREAKOUT CHECK (line 1350-1362)
  currentLTP = 200.00 (live WebSocket price)
  hasPriceAction = config.conditions has "Price Action"? → false (conditions empty)
  
  !hasPriceAction → automatic BREAKOUT ✅
  → targetStock = TATASTEEL

Step 6: KITE SESSION CHECK (line 1382-1425)
  client.accessToken = "QZznO9xZaRkem3dPG9dm8iz9Zq2S82Io" ✅
  KITE_AUTO_LOGIN_ENABLED = "true"
  → performKiteAutoLogin(client.id) → refresh session → naya token

Step 7: POSITION SIZING (algoEngine.ts:1457-1521)

  ┌──────────────────────────────────────────────────────────────────┐
  │ 🔑 FORMULA: Quantity = Capital at Risk / SL Points              │
  │    Capital at Risk = Live Balance × riskPerTrade% (capped by DB) │
  │    SL Points = entryPrice × fixedPercent% (for Fixed % type)     │
  │    Buying power check: ON only if misMarginRate > 0              │
  │    misMarginRate = -1 → buying power check DISABLED              │
  └──────────────────────────────────────────────────────────────────┘

  Kite.getMargins() → equity.net = ₹1,70,000 (example live balance)

  riskPerTrade = 3% (from config)
  capitalAtRisk = 1,70,000 × 3/100 = ₹5,100

  client.capital (DB) = ₹50,000
  capitalAtRisk = min(5,100, 50,000) = ₹5,100 ✅

  entryPrice = ₹199.40
  fixedPercent = 1% (from config)
  slPoints = 199.40 × 1/100 = ₹1.99 (SL points = 1% of entry price)

  misMarginRate = -1 (DB) → > 0 ❌ buying power check OFF
  → quantity = qtyByRisk = floor(capitalAtRisk / slPoints) = floor(5100 / 1.99) = 2562 shares (direct, no min())

  Agar misMarginRate = 0.20 hota → buying power check ON
  qtyByBuyingPower = floor(170000 / (199.40 × 0.20)) = floor(170000 / 39.88) = 4262 shares
  quantity = min(2562, 4262) = 2562 shares ✅

Step 8: STOP LOSS & TARGET
  SL% = 1% (from config)
  stopLoss = entryPrice - slPoints = 199.40 - 1.99 = ₹197.41

  Target% = 2% (from config)
  target = 199.40 × (1 + 2/100) = ₹203.39

  Trailing SL = -1 (disabled)
  Trailing Target = -1 (disabled)

Step 9: PLACE ENTRY ORDER — SL-Market
  Kite.placeOrder({
    exchange: "NSE",
    tradingsymbol: "TATASTEEL",
    transaction_type: "BUY",
    quantity: 2562,
    order_type: "SL-Market",      // ← trigger price ke upar fill
    product: "MIS",
    validity: "DAY",
    trigger_price: 199.40
  })

  → Response: { status: "success", data: { order_id: "200626000123456" } }

Step 10: POLL ENTRY ORDER
  Kite.getOrderById("200626000123456")
  → { status: "COMPLETE", average_price: 200.10 }

  actualEntryPrice = 200.10  // actual fill price

Step 11: PLACE SL-M SELL ORDER
  Kite.placeOrder({
    exchange: "NSE",
    tradingsymbol: "TATASTEEL",
    transaction_type: "SELL",
    quantity: 2562,
    order_type: "SL-M",
    product: "MIS",
    validity: "DAY",
    trigger_price: 198.10  // 200.10 × (1 - 1/100)
  })

Step 12: PLACE TARGET LIMIT ORDER
  Kite.placeOrder({
    exchange: "NSE",
    tradingsymbol: "TATASTEEL",
    transaction_type: "SELL",
    quantity: 2562,
    order_type: "LIMIT",
    product: "MIS",
    validity: "DAY",
    price: 204.10  // 200.10 × (1 + 2/100)
  })

Step 13: SAVE TRADE IN DB
  prisma.trade.create({
    clientId: "b364d72f...",
    strategyId: "c7bafa89...",
    symbol: "TATASTEEL",
    orderType: "MIS",
    entryPrice: 200.10,
    quantity: 2562,
    stopLoss: 198.10,
    target: 204.10,
    status: "open",
    slTriggerPrice: 198.10,
    entryOrderId: "200626000123456",
    slOrderId: "200626000123457",
    targetOrderId: "200626000123458"
  })

Step 14: LOGS
  prisma.strategyLog.create({
    message: "Bought 2562 TATASTEEL @ 200.10 for Vikash sharma..."
  })
  prisma.auditLog.create({ action: "AUTO_TRADE_INITIATED", ... })
```

### ⏰ 09:20-15:25 — Monitor Scheduler (OCO + Trailing SL)

**File:** `algoEngine.ts:334-672`

```
Base timer: har 10 sec
Per-trade filter: strategy.configJson.basicInfo.checkIntervalSec = 60

→ Har trade ko sirf har 60 sec check kiya jata hai

┌─────────────────────────────────────────────────────────────┐
│ MONITOR LOOP (every 60 sec for TATASTEEL trade):            │
├─────────────────────────────────────────────────────────────┤
│ 1. Read trade from DB (status = "open")                     │
│ 2. Read strategy.configJson                                 │
│ 3. Check SL order status via Kite API                       │
│    Kite.getOrderById(slOrderId)                             │
│    → status: "COMPLETE"? → SL HIT ❌                         │
│    → Cancel Target order (OCO)                               │
│    → SELL remaining quantity → trade closed                 │
│                                                              │
│ 4. Check Target order status via Kite API                    │
│    Kite.getOrderById(targetOrderId)                          │
│    → status: "COMPLETE"? → TARGET HIT ✅                     │
│    → Cancel SL order (OCO)                                   │
│    → P&L calculated → trade closed                          │
│                                                              │
│ 5. TRAILING SL (if trailingSL > 0; -1 = disabled)          │
│    LTP from WebSocket = 205.00                               │
│    trailingSL = 0.5%                                         │
│    Price move = (205-200.10)/200.10 = 2.45%                 │
│    trailsToApply = floor(2.45/0.5) = 4                      │
│    trailStep = 200.10 × 0.5/100 = 1.00                      │
│    newSL = 200.10 + (4 × 1.00) = 204.10                     │
│    currentSL = 198.10                                        │
│    204.10 > 198.10 → Kite.modifyOrder(trigger_price=204.10) │
│    DB update: slTriggerPrice = 204.10                        │
│                                                              │
│ 6. TRAILING TARGET (if trailingTarget > 0; -1 = disabled)   │
│    Mirrors Trailing SL logic but modifies LIMIT order price  │
│    Kite.modifyOrder(price=newTarget)                         │
│    DB update: target = newTarget                             │
│                                                              │
│ 7. MARKET CLOSE CHECK                                        │
│    currentTime >= "15:25"? → FORCE SELL                     │
│    Kite.placeOrder(MARKET SELL)                              │
│    P&L = (exitPrice - entryPrice) × qty                     │
│    Trade status → "sl_hit" / "target_hit"                   │
└─────────────────────────────────────────────────────────────┘
```

### ⏰ 15:25 — exitTime → Market Close

```
currentTime >= "15:25" → FORCE EXIT

Kite.placeOrder({
  exchange: "NSE",
  tradingsymbol: "TATASTEEL",
  transaction_type: "SELL",
  quantity: 2562,
  order_type: "MARKET",
  product: "MIS",
  validity: "DAY"
})

→ exitPrice = 206.00
→ P&L = (206.00 - 200.10) × 2562 = ₹15,115.80 profit ✅

Trade update:
  status: "target_hit"
  pnl: 15115.80
  exitPrice: 206.00
  exitReason: "Market Close (15:25)"
```

---

## 5. Har Field Change Ka Effect

### 5.1 basicInfo Fields

| Field | Current (DB) | Change kare to kya hoga |
|-------|:------------:|-------------------------|
| **segment** | `NSE F&O` | `Nifty 50` → sirf Nifty 50 stocks filter. `Bank Nifty` → sirf Bank Nifty stocks. `Cash` → sirf cash stocks |
| **entryTime** | `09:20` | `09:30` → trade 10 min late lagegi. Candle data different hoga |
| **preSelectTime** | `09:15` | `09:10` → stock 5 min pehle select hoga. Kam candle data available |
| **exitTime** | `15:25` | `15:00` → force exit 25 min pehle. `15:30` → last moment exit |
| **selectPosition** | `1` | `2` → second most sorted stock. `3` → third |
| **action** | `Long` | `Short` → sort descending (gainers pehle), sell trade |
| **tradeType** | `Intraday` | `Swing` → product = NRML. `Delivery` → product = CNC |
| **timeframe** | `5m` | `15m` → fallback candle monitoring 15-min interval use karega |
| **checkIntervalSec** | `60` | `120` → monitor har 2 min check karega (less frequent) |
| **orderType** | `SL-Market` | `Market` → direct market order (no trigger). `Limit` → limit order at entry price |

### 5.2 stoploss Fields

| Field | Current (DB) | Change kare to kya hoga |
|-------|:------------:|-------------------------|
| **type** | `Trailing SL` | `Fixed %` → trailing band off, fixed SL percentage. `Fixed Points` → points-based SL |
| **fixedPercent** | `1` | `2` → SL 2% door (more room, more loss potential). `0.5` → tight SL |
| **trailingSL** | `-1 (disabled)` | `0.5` → har 0.5% move par SL trail karega. `-1` ya `0` → trailing off |
| **orderType** | `Market` | `Limit` → exact price SL (partial fill risk) |

### 5.3 target Fields

| Field | Current (DB) | Change kare to kya hoga |
|-------|:------------:|-------------------------|
| **type** | `Trailing Target` | `Profit %` → fixed target %. `Risk Reward Ratio` → target = SL points × RR |
| **profitPercent** | `2` | `3` → 3% target (bigger profit, less likely to hit). `1` → quick small profit |
| **riskRewardRatio** | `2` | `3` → target = SL points × 3 |
| **trailingTarget** | `-1 (disabled)` | `0.5` → har 0.5% move par target trail karega (LIMIT order price modify). `-1` ya `0` → trailing off |

### 5.4 tradeAction Fields

| Field | Current (DB) | Change kare to kya hoga |
|-------|:------------:|-------------------------|
| **bufferPercent** | `0.1` | `0` → exact candle high pe entry. `0.5` → 0.5% upar. Zyada buffer = late entry |
| **marketProtection** | `undefined` | `-1` → auto protection (engine default). `0` → off. `1-5` → protection % |

### 5.5 riskManagement Fields

| Field | Current (DB) | Change kare to kya hoga |
|-------|:------------:|-------------------------|
| **riskPerTrade** | `3` | `5` → live balance ka 5% allocate. Zyada shares but zyada risk |
| **capitalAllocation** | `10` | ❌ Engine enforce nahi karta (future use) |
| **maxDailyLoss** | `5000` | ❌ Engine enforce nahi karta |
| **maxDailyProfit** | `15000` | ❌ Engine enforce nahi karta |
| **maxOpenPositions** | `3` | ❌ Engine enforce nahi karta |
| **killSwitch** | `false` | ❌ Engine enforce nahi karta |

### 5.6 Conditions

| Change | Effect |
|--------|--------|
| Empty `[]` (current) | Sirf segment filter. Sab stocks pass |
| Add `Pre Open Change % < -1.5` | Sirf -1.5%+ girne wale stocks filter |
| Add `RSI < 30` | RSI 30 se neeche wale stocks (Kite candle data chahiye) |
| Add `AND` condition | Dono conditions true honi chahiye |
| Add `OR` condition | Koi ek condition true ho to pass |

---

## 6. Failed Trades Analysis — Kya Galat Hua

### Trade 1: MPHASIS (19 Jun)

```
Log: "Skipped: Calculated quantity is 0
      (Allocated amount ₹854.90 is less than entry price ₹3040.24)."

Root Cause:
  riskPerTrade = 3%
  Live balance ≈ ₹28,497 (bahut kam)
  Allocated = 28,497 × 3% = ₹854.90
  Entry price = ₹3,040.24 (MPHASIS ka LTP)
  Quantity = floor(854.90 / 3040.24) = 0 ❌

Solution:
  riskPerTrade ko 50-100% karna padega ya
  Client ko Zerodha me zyada paise daalne honge
```

### Trade 2: INFY (18 Jun)

```
Log: "Kite order failed: Incorrect api_key or access_token."

Root Cause:
  Vikash ka accessToken expire ho gaya tha
  Auto-login fail hua (TOTP ya credentials issue)

Solution:
  Check KITE_AUTO_LOGIN_ENABLED = "true"
  Verify TOTP secret + password
  Manual re-login from admin panel
```

### Trade 3: TATASTEEL (17 Jun)

```
Log: "Market orders without market protection are not allowed via API."

Root Cause:
  tradeAction.marketProtection undefined tha
  Engine -1 treat karta hai (auto protection)
  Lekin Kite API ko explicit protection chahiye

Followed by:
  "IP (54.209.77.35) is not allowed to place orders for this app."

Root Cause:
  Server IP Kite console me whitelisted nahi tha

Solution:
  Kite developer console me server IP whitelist karo
  marketProtection = 1 set karo in strategy config
```

---

## 7. Quick Reference — Code File Locations

| Component | File | Line |
|-----------|------|:----:|
| Strategy Config Interface | `src/app/admin/strategies/page.tsx` | 39-86 |
| Create Strategy UI | `src/app/admin/strategies/page.tsx` | 783-816 |
| Edit Strategy UI | `src/app/admin/strategies/page.tsx` | 680-696 |
| Toggle Status | `src/app/admin/strategies/page.tsx` | 715-744 |
| Clone Strategy | `src/app/admin/strategies/page.tsx` | 699-713 |
| Delete Strategy | `src/app/admin/strategies/page.tsx` | 746-771 |
| Assign Client | `src/app/admin/strategies/page.tsx` | 837-879 |
| API: List/Create Strategy | `src/app/api/admin/strategies/route.ts` | 35-125 |
| API: Update/Delete/Clone | `src/app/api/admin/strategies/[id]/route.ts` | 7-238 |
| API: Client Assignments | `src/app/api/admin/strategies/assignments/route.ts` | 47-119 |
| API: Templates | `src/app/api/admin/strategies/templates/route.ts` | 107-117 |
| API: Logs | `src/app/api/admin/strategies/logs/route.ts` | 1-68 |
| Algo Engine (full) | `src/models/algoEngine.ts` | 1-2103 |
| └─ Token Refresh Scheduler | `src/models/algoEngine.ts` | 273-332 |
| └─ Pre-Open Scheduler | `src/models/algoEngine.ts` | 201-271 |
| └─ Monitor Scheduler | `src/models/algoEngine.ts` | 334-672 |
| └─ preSelectAllClients | `src/models/algoEngine.ts` | 1068-1170 |
| └─ executePreOpenTrades | `src/models/algoEngine.ts` | 1172-1450+ |
| └─ matchesConditions | `src/models/algoEngine.ts` | 100-199 |
| Kite Client | `src/lib/kite.ts` | 1-246 |
| Technical Indicators | `src/lib/indicators.ts` | 1-121 |
| Prisma Schema | `prisma/schema.prisma` | 1-252 |
| Database Config | `src/lib/db.ts` | 1-69 |
| Global State | `src/viewmodels/AppContext.tsx` | 1-371 |

---

---

## 8. Current Code Issues — Breakout + SL/Target Flow

> **File:** `src/models/algoEngine.ts`
>
> Ye 3 issues aapne bataye aur maine code verify kiya. Exact line numbers ke saath.

### Issue 1: Breakout Check Galat Price Pe Ho Raha Hai

**File:** `algoEngine.ts:1350-1358`

```
Current Code:       if (!hasPriceAction || currentLtp >= candleHigh)
                              ↑                          ↑
                     conditions empty?              candleHigh se compare
                     → true (auto pass)
```

**Problem:** Jab conditions empty hain to `hasPriceAction = false`, toh `!hasPriceAction = true` → **hamesha pass ho jata hai**. Lekin jab conditions set hain tab `currentLtp >= candleHigh` check hota hai — candleHigh se, **entryPrice se nahi**.

**Real Example:**
| Item | Value |
|------|-------|
| Candle HIGH | ₹199.20 |
| 0.1% Buffer → **Entry Price** | **₹199.40** |
| Current LTP | ₹199.30 |

| Check | LTP vs | Result |
|-------|--------|--------|
| ❌ Current: `LTP >= candleHigh` | ₹199.30 >= ₹199.20 | ✅ **PASS (galat)** — buffer ignore |
| ✅ Expected: `LTP >= entryPrice` | ₹199.30 >= ₹199.40 | ❌ **FAIL (sahi)** — abhi breakout nahi hua |

**Fix:** `candleHigh` ki jagah `breakoutEntryPrice` use karo:
```typescript
// Line 1354: change karo
if (!hasPriceAction || currentLtp >= breakoutEntryPrice) {
```

---

### Issue 2: Breakout Fail → Trade Skip (Koi Wait Nahi)

**File:** `algoEngine.ts:1358-1366`

```
} else {
  console.log(`...Skipping.`);
}
// ...
if (!targetStock) {
  continue;  // ❌ Trade permanently skip
}
```

**Problem:** Jab LTP entry price cross nahi karta (e.g. abhi ₹199.30 hai, entry ₹199.40 hai), to engine us stock ko **skip** kar deta hai aur wapas kabhi check nahi karta. Market me 5 min baad LTP ₹200 ho sakta hai — tab bhi trade nahi lagegi.

**Current Flow (galat):**
```
09:20 → LTP ₹199.30, entry ₹199.40
       → "Breakout not met. Skipping." ❌
       → Trade kabhi nahi lagega
```

**Expected Flow (sahi — SL-Market order type):**
```
09:20 → LTP ₹199.30, entry ₹199.40
       → SL-Market BUY order place karo @ trigger ₹199.40
       → LTP baad me ₹199.40 cross karega
       → SL-M order auto-trigger → BUY execute ✅
```

**Fix:** Jab `orderType === 'SL-Market'` ho, to breakout check **hata do** — SL-M order apne aap trigger hoga jab LTP trigger price cross karega:
```typescript
// Conditionally skip breakout check for SL-Market
const isSLMarket = config.tradeAction?.orderType === 'SL-Market';
if (isSLMarket || !hasPriceAction || currentLtp >= breakoutEntryPrice) {
  targetStock = candidateStock;
}
```

---

### Issue 3: SL (1%) + Target (2%) Calculation — Yehi Dekho

**File:** `algoEngine.ts:1512, 1587, 1595-1604`

```typescript
// SL Calculation (line 1512):
slPoints = entryPrice * (slPercent / 100);
// entryPrice = ₹199.40, slPercent = 1
// slPoints = 199.40 * 0.01 = ₹1.99

// Stop Loss price (line 1587):
const stopLoss = entryPrice - slPoints;
// = 199.40 - 1.99 = ₹197.41 ✅  — 1% SL

// Target price (line 1603):
target = entryPrice * (1 + targetPercent / 100);
// targetPercent = 2
// = 199.40 * 1.02 = ₹203.39 ✅  — 2% Target
```

**SL-Market trigger price for BUY entry (line 1627-1629):**
```typescript
orderTypeParam = 'SL-M';
triggerPriceParam = Number(entryPrice.toFixed(2));
// = ₹199.40 ✅  — sahi hai
```

**SL order placed after entry fills (line 1767-1775):**
```typescript
trigger_price: Number(stopLoss.toFixed(2));
// = ₹197.41 ✅  — 1% SL
```

✅ **Yeh calculation sahi hai.** Koi fix nahi chahiye.

---

### Summary Table — 3 Issues

| # | File:Line | Issue | Fix Required? |
|---|-----------|-------|:-------------:|
| 1 | `algoEngine.ts:1354` | `currentLtp >= candleHigh` (candleHigh se compare, entryPrice se nahi) | ✅ **Haan** — `breakoutEntryPrice` use karo |
| 2 | `algoEngine.ts:1358-1366` | Breakout fail → trade skip. SL-Market order type ke saath bhi skip | ✅ **Haan** — SL-Market ho to breakout check hatao |
| 3 | `algoEngine.ts:1512,1587,1603` | SL=1%, Target=2% calculation | ❌ **Nahi** — sahi calculate ho raha hai |

---

## 9. Ek Hi Page Mein — Complete Summary

```
╔══════════════════════════════════════════════════════════════╗
║           PRE-OPEN MOMENTUM BREAKOUT — FULL FLOW            ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  [08:00] TOKEN REFRESH                                       ║
║    → Vikash (RZJ500) ka TOTP auto-login → naya accessToken   ║
║                                                              ║
║  [09:08] PRE-OPEN DATA                                       ║
║    → NSE se 200+ stocks ka data fetched                      ║
║    → Stored in RAM cache + DB backup                         ║
║                                                              ║
║  [09:15] STOCK PRE-SELECTION (per-strategy)                  ║
║    → Segment filter: NSE F&O (isFo=true)                     ║
║    → Conditions filter: [] empty → sab pass ✅               ║
║    → Sort: Long → ascending by changePercent                 ║
║    → Pick: selectPosition=1 → TATASTEEL (-2.1%) 🎯          ║
║    → Map: Vikash → TATASTEEL stored in RAM                  ║
║                                                              ║
║  [09:15-09:20] CANDLE BUILD                                  ║
║    → TATASTEEL 5-min candle: HIGH=199.20                     ║
║                                                              ║
║  [09:20] TRADE EXECUTION (per-strategy)                      ║
║    → Breakout check: conditions empty → auto PASS ✅         ║
║    → Entry price: 199.20 × 1.001 = ₹199.40                   ║
║    → Position size: capitalAtRisk/slPoints = 5100/1.99 → 2562 shares ║
║    → Order: SL-Market BUY 2562 TATASTEEL @ trigger ₹199.40         ║
║    → After fill: SL-M SELL 2562 @ trigger ₹198.10                  ║
║    → After fill: Target LIMIT SELL 2562 @ price ₹204.10            ║
║    → Trade saved in DB with all 3 order IDs                  ║
║                                                              ║
║  [09:20-15:25] MONITOR (OCO + TRAILING SL/TARGET)             ║
║    → Every 60 sec: check SL/Target order status via Kite API ║
║    → OCO: one hits → cancel the other                        ║
║    → Trailing SL: LTP up → SL trigger up modify              ║
║    → Trailing Target: LTP up → Target LIMIT price up modify  ║
║    → -1 se dono trailing disable                             ║
║                                                              ║
║  [15:25] MARKET CLOSE                                        ║
║    → Force MARKET SELL → exit                                ║
║    → P&L calculated → trade closed                           ║
║    → StrategyLog + AuditLog created                          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

CURRENT DB STATE (20 June 2026):
  Strategies: 1 (Pre-Open Momentum Breakout, active)
  Conditions: 0 (empty array — no filter)
  Clients:    1 (Vikash sharma, RZJ500, ₹50,000 cap)
  Trades:     3 failed attempts (MPHASIS, INFY, TATASTEEL)
  App Engine: isTradingActive = true, timings = 08:00/09:08/09:20
```
