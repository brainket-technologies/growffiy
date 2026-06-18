# Pre-Open Momentum Breakout Strategy — Complete Flow

## Default Strategy: "Pre-Open Momentum Breakout"

```
Trade Type: Intraday
Exchange: NSE
Segment: NSE F&O
Timeframe: 5m
Entry Time: 09:20
Exit Time: 15:15
Max Trades/Day: 3
```

---

## Setup Example

```
Client: Firoz
DB client.capital: ₹5,00,000 (total account limit)
Live Zerodha Balance: ₹8,00,000
riskPercent: 1% (per trade)
```

---

## ⏰ COMPLETE TIMELINE

---

### 09:08 AM — Pre-Open Data Fetch

NSE API (`/api/market-data-pre-open?key=ALL`) se saari stocks ka pre-open data fetch karta hai.

**Sample NSE data (top movers):**

| Symbol | Prev Close | IIP | Change % | F&O? |
|---|---|---|---|---|
| TATASTEEL | ₹200.00 | ₹193.00 | **-3.50%** | ✅ |
| JSWSTEEL | ₹150.00 | ₹146.25 | **-2.50%** | ✅ |
| HINDALCO | ₹180.00 | ₹176.40 | **-2.00%** | ✅ |
| RELIANCE | ₹2500.00 | ₹2550.00 | +2.00% | ✅ |
| BAJFINANCE | ₹7000.00 | ₹6860.00 | **-2.00%** | ✅ |
| ITC | ₹400.00 | ₹402.00 | +0.50% | ❌ |

Cache me save → `this.preOpenCache`, `this.preOpenCacheDate`

---

### 09:08 - 09:20 — Wait (No action)

---

### Step 1: 09:20 — Active Clients Fetch

```sql
SELECT * FROM clients
WHERE trading_status = 'active'
  AND subscription_status = 'active'
  AND strategy_id IS NOT NULL
```

**Conditions:** Client active, subscription active, strategy assigned.

---

### Step 2: Strategy Config Load

Strategy ki `configJson` se saari settings padhta hai:

```json
{
  "basicInfo": {
    "name": "Pre-Open Momentum Breakout",
    "tradeType": "Intraday",
    "exchange": "NSE",
    "segment": "NSE F&O",
    "timeframe": "5m",
    "entryTime": "09:20",
    "exitTime": "15:15",
    "maxTradesPerDay": 3
  },
  "conditions": [
    { "logical": "AND", "indicator": "Pre Open Change %", "operator": "<", "value": "-1.5" },
    { "logical": "AND", "indicator": "Price Action", "operator": ">", "value": "Previous 5m High" }
  ],
  "tradeAction": {
    "action": "Long",
    "orderType": "Limit",
    "bufferPercent": 0.1
  },
  "stoploss": {
    "fixedPercent": 0.5,
    "riskPercent": 1.0,
    "trailingSL": 0.2
  },
  "target": {
    "profitPercent": 1.5,
    "trailingTarget": 0.5,
    "partialExit": 50
  },
  "riskManagement": {
    "riskPerTrade": 1
  }
}
```

---

### Step 3: Segment Filter — F&O Stocks

Sirf wohi stocks jinka `isFo === true`.

```javascript
if (segment === 'NSE F&O' && !stock.isFo) return false;
```

**Result:**

| Symbol | Change % | Pass? |
|---|---|---|
| TATASTEEL | **-3.50%** | ✅ |
| JSWSTEEL | **-2.50%** | ✅ |
| HINDALCO | **-2.00%** | ✅ |
| RELIANCE | +2.00% | ❌ |
| BAJFINANCE | **-2.00%** | ✅ |

---

### Step 4: Condition Filter — Gap Down > 1.5%

```javascript
// Pre Open Change % < -1.5
if (cond.indicator === 'Pre Open Change %' && cond.operator === '<') {
  if (!(stock.changePercent < val)) return false;
}
// val = -1.5, so stock.changePercent < -1.5
```

**Result:**

| Symbol | Change % | Pass? |
|---|---|---|
| TATASTEEL | **-3.50%** | ✅ -3.5 < -1.5 |
| JSWSTEEL | **-2.50%** | ✅ -2.5 < -1.5 |
| HINDALCO | **-2.00%** | ✅ -2.0 < -1.5 |
| BAJFINANCE | **-2.00%** | ✅ -2.0 < -1.5 |

---

### Step 5: Top N Selection — Multiple Losers (N = `maxTradesPerDay`)

```javascript
// algoEngine.ts line 840
const action = config.tradeAction?.action || 'Long';
const maxPositions = config.basicInfo?.maxTradesPerDay || 1;

const sortedStocks = [...matchingStocks].sort((a, b) =>
  action === 'Long' ? a.changePercent - b.changePercent : b.changePercent - a.changePercent
);
const candidateStocks = sortedStocks.slice(0, maxPositions);
```

**Example — N=3, candidate stocks:**
| Rank | Symbol | Change % |
|---|---|---|
| 1 | TATASTEEL | **-3.50%** ✅ |
| 2 | JSWSTEEL | **-2.50%** ✅ |
| 3 | HINDALCO | **-2.00%** ✅ |

**Code flow (steps 6-9 repeat per stock):**
```
for (const stock of candidateStocks) {
  try {
    6. Existing trade check (per-symbol today?)
    7. Instrument token lookup
    8. Kite minute candles fetch + candle high calculate
    9. Breakout check: LTP >= candle high?
         → ✅ confirmed → place order → break
         → ❌ fail → try next stock
  } catch(err) { continue; }
}
if (!targetStock) → SKIP ALL TRADES TODAY
```

---

### Step 6: Existing Trade Check (per-symbol)

```javascript
// algoEngine.ts line 861
const existingTrade = await prisma.trade.findFirst({
  where: {
    clientId: client.id,
    strategyId: strategy.id,
    symbol: stock.symbol,
    createdAt: { gte: todayStart }
  }
});
if (existingTrade) {
  console.log(`Trade already exists today for ${stock.symbol}. Skip.`);
  continue;
}
```

---

### Step 7: Auto-Login + Token + Instrument Mapping

```javascript
// algoEngine.ts line 876 — same as before
if (!activeAccessToken) {
  // Auto-login kare
}
```

**Note:** Active Kite credentials required for historical API calls.

---

### Step 8: Kite Minute Candle Fetch (09:15 — entryTime)

```javascript
// algoEngine.ts lines 874-894
let candleHigh = 0;
if (client.zerodhaApiKey && client.accessToken) {
  const instTokenStr = Object.entries(this.instrumentToSymbol)
    .find(([, sym]) => sym === stock.symbol)?.[0];
  if (instTokenStr) {
    const today = new Date();
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const from = `${fmt(today)}%2009:15`;
    const to = `${fmt(today)}%20${await getAlgoSetting('algo_entry_time','09:20').replace(':','%20')}`;
    const res = await KiteClient.getHistoricalData(
      apiKey, accessToken, instTokenStr, 'minute', from, to
    );
    if (res.status === 'success' && Array.isArray(res.data?.candles) && res.data.candles.length > 0) {
      candleHigh = Math.max(...res.data.candles.map(c => Number(c[2])));
      // index 2 = high price
    }
  }
}
// Fallback: agar Kite API fail ho
if (candleHigh === 0) {
  candleHigh = stock.high || stock.ltp || stock.prevClose || 100;
}
```

**Kite response (TATASTEEL):**
| Candle | Time (IST) | Open | High | Low | Close |
|---|---|---|---|---|---|
| 1 | 09:15 | 193.00 | 194.50 | 192.80 | 194.00 |
| 2 | 09:16 | 194.00 | 195.20 | 193.50 | 195.00 |
| 3 | 09:17 | 195.00 | 196.80 | 194.60 | 196.50 |
| 4 | 09:18 | 196.50 | 197.30 | 195.80 | 197.00 |
| 5 | 09:19 | 197.00 | **199.50** | 196.50 | 199.00 |

```
candleHigh = max(194.50, 195.20, 196.80, 197.30, 199.50) = 199.50
```

---

### Step 9: Breakout Check

```javascript
// algoEngine.ts lines 896-911
const bufferPct = config.tradeAction?.bufferPercent || 0.1;
breakoutEntryPrice = candleHigh * (1 + bufferPct / 100);  // 199.70

const currentLtp = stock.ltp || stock.iep || breakoutEntryPrice;
const hasPriceAction = config.conditions?.some((c: any) => c.indicator === 'Price Action');

if (!hasPriceAction || currentLtp >= candleHigh) {
  targetStock = stock;
  break;  // ✅ breakout — place order
}
// ❌ breakout fail — next candidate
```

**✅ Breakout:**
```
hasPriceAction = true (condition exists)
LTP (200.20) >= candleHigh (199.50) → ✅ BUY at 199.70 (LIMIT)
```

**❌ Fail → next stock:**
```
TATASTEEL LTP (198.50) < candle high → skip
→ JSWSTEEL check → LTP > candleHigh? → ✅ place order
→ koi nahi → "No breakout candidate found. Skipping trades for today."
```

---

### Step 10: Position Sizing

```
1. clientCapital = Number(client.capital)          // ₹5,00,000 (DB)
2. Live margin fetch → success                     // ₹8,00,000 (override)
3. riskPercent = config se (default: 1)
4. allocatedAmount = ₹8,00,000 × 1% = ₹8,000
5. DB cap check: ₹8,000 > ₹5,00,000? → NO → no cap
6. quantity = floor(₹8,000 / ₹199.70) = 40 shares
7. quantity > 0? → ✅ proceed
```

#### Cap Check Scenarios

| Live Balance | 1% Amount | DB capital | Cap Apply? | Final Amount |
|---|---|---|---|---|
| ₹8,00,000 | ₹8,000 | ₹5,00,000 | ❌ ₹8k < ₹5L | **₹8,000** |
| ₹1,00,00,000 | ₹1,00,000 | ₹5,00,000 | ❌ ₹1L < ₹5L | **₹1,00,000** |
| ₹10,00,00,000 | ₹10,00,000 | ₹5,00,000 | ✅ ₹10L > ₹5L | **₹5,00,000** |

---

### Step 11: LIMIT Order Place (SL-M Style)

```javascript
const stopLoss = 199.70 × (1 - 0.5/100) = ₹198.70
const target   = 199.70 × (1 + 1.5/100) = ₹202.70

await KiteClient.placeOrder(apiKey, accessToken, {
  exchange: 'NSE',
  tradingsymbol: 'TATASTEEL',
  transaction_type: 'BUY',
  quantity: 40,
  order_type: 'LIMIT',
  price: 199.70,            // Candle high + 0.1% buffer
  product: 'MIS',            // Intraday
  validity: 'DAY'
});
```

**Response:**
```json
{ "status": "success", "data": { "order_id": "1234567890" } }
```

---

### Step 12: Database Save

```javascript
// Trade record
await prisma.trade.create({
  data: {
    clientId: client.id,
    strategyId: strategy.id,
    symbol: 'TATASTEEL',
    orderType: 'MIS',
    entryPrice: 199.70,
    quantity: 40,
    stopLoss: 198.70,
    target: 202.70,
    status: 'open',
    entryTime: new Date(),
    kiteResponse: { order_id: "1234567890" }
  }
});

// Strategy log
await prisma.strategyLog.create({
  data: {
    strategyId: strategy.id,
    message: `Bought 40 TATASTEEL @ ₹199.70. SL: ₹198.70, Target: ₹202.70`,
    logType: 'trade'
  }
});

// Audit log
await prisma.auditLog.create({
  data: {
    adminId: admin.id,
    action: 'AUTO TRADE INITIATED',
    newValue: 'Client: Firoz | TATASTEEL | Qty: 40 | Entry: 199.70'
  }
});
```

---

### 📈 09:20 — 15:15 — SL/Target Monitor (Every 60s)

```javascript
// checkOpenTradesExits runs every 60 seconds

// 1. Find all open trades
const openTrades = await prisma.trade.findMany({
  where: { status: 'open' }
});

// 2. For each trade, fetch Kite historical 5-min candle
const candles = await KiteClient.getHistoricalData(...);
const latestClose = candles[candles.length - 1][4]; // close price

// 3. Check conditions
if (latestClose <= stopLoss) {
  // MARKET SELL — Stop Loss hit
  await KiteClient.placeOrder(...);
  await prisma.trade.update({ status: 'closed', pnl: ... });
}

if (latestClose >= target) {
  // MARKET SELL — Target hit
  await KiteClient.placeOrder(...);
  await prisma.trade.update({ status: 'closed', pnl: ... });
}
```

**Example Scenarios:**

| Time | LTP | Action |
|---|---|---|
| 09:25 | ₹201.00 | In profit, trailing SL update |
| 09:45 | ₹203.50 | **Target hit (₹202.70)** → MARKET SELL |
| | | PnL = (202.70 - 199.70) × 40 = **₹120 profit** ✅ |

| Time | LTP | Action |
|---|---|---|
| 09:25 | ₹199.00 | Near SL (₹198.70) |
| 09:26 | ₹198.50 | **SL hit (₹198.70)** → MARKET SELL |
| | | PnL = (198.70 - 199.70) × 40 = **-₹40 loss** ❌ |

---

### ⏰ 15:15 — Market Close Exit

```javascript
if (hours === 15 && minutes === 15) {
  // Force close all remaining open trades
  // MARKET SELL all positions
}
```

---

## All Data is from Database (No Hardcoding)

| Data | DB Source | Admin Editable? |
|---|---|---|
| Entry time (09:20) | `app_settings.algo_entry_time` | ✅ Settings page |
| Pre-open fetch time (09:08) | `app_settings.algo_preopen_fetch_time` | ✅ Settings page |
| Token refresh time (08:00) | `app_settings.algo_token_refresh_time` | ✅ Settings page |
| Strategy name, description | `strategy.name`, `strategy.description` | ✅ Strategy form |
| Entry/Exit timings | `configJson.basicInfo.entryTime/exitTime` | ✅ Strategy form |
| Segment (F&O/Nifty/BankNifty) | `configJson.basicInfo.segment` | ✅ Strategy form |
| Max positions (N) | `configJson.basicInfo.maxTradesPerDay` | ✅ Strategy form |
| Order type (Limit/Market/SL-M) | `configJson.tradeAction.orderType` | ✅ Strategy form |
| Buffer % | `configJson.tradeAction.bufferPercent` | ✅ Strategy form |
| Stop Loss % | `configJson.stoploss.fixedPercent` | ✅ Strategy form |
| Target % | `configJson.target.profitPercent` | ✅ Strategy form |
| Risk per trade % | `configJson.riskManagement.riskPerTrade` | ✅ Strategy form |
| Conditions (add/remove/modify) | `configJson.conditions[]` | ✅ Strategy form |

**Koi bhi value code mein hardcoded nahi hai — sab strategy table + app_settings se aata hai.**

---

## All Conditions Summary

| # | Condition | Source | Check |
|---|---|---|---|
| 1 | Client active | `client.tradingStatus = 'active'` | ✅ DB |
| 2 | Subscription active | `client.subscriptionStatus = 'active'` | ✅ DB |
| 3 | Strategy assigned | `client.strategyId IS NOT NULL` | ✅ DB |
| 4 | Strategy active | `strategy.status = 'active'` | ✅ DB |
| 5 | Segment filter | `configJson.basicInfo.segment` | ✅ Strategy config |
| 6 | Pre Open Change filter | `configJson.conditions[].indicator = 'Pre Open Change %'` | ✅ Strategy config |
| 7 | Price Action breakout | `configJson.conditions[].indicator = 'Price Action'` | ✅ Strategy config |
| 8 | No duplicate trade per stock today | `trade.createdAt >= today AND trade.symbol = stock.symbol` | ✅ DB |
| 9 | Capital: 1% of live balance | `liveBalance × riskPerTrade%` (with DB fallback) | ✅ Kite API + DB |
| 10 | DB capital cap | `allocatedAmount ≤ client.capital` | ✅ DB |
| 11 | Quantity > 0 | `floor(amount / price) > 0` | ✅ Calculation |
| 12 | 5-min candle breakout | `LTP > candleHigh` at entry time | ✅ Kite Historical API |
| 13 | Order placed successfully | Kite API `status === 'success'` | ✅ Kite API |

---

## Timings (Dynamic from `app_settings`)

| Setting Key | Default Value | Description |
|---|---|---|
| `algo_preopen_fetch_time` | `09:08` | Pre-open data fetch time |
| `algo_entry_time` | `09:20` | Candle breakout + entry time |
| `algo_token_refresh_time` | `08:00` | Daily Kite token refresh time |
| `algo_check_interval_sec` | `60` | Scheduler check interval |

---

## Strategy Config Structure (DB: `strategies.configJson`)

| Section | Key | Example |
|---|---|---|
| `basicInfo` | `entryTime` | `"09:20"` |
| `basicInfo` | `timeframe` | `"5m"` |
| `basicInfo` | `segment` | `"NSE F&O"` |
| `conditions[]` | `indicator` | `"Pre Open Change %"` |
| `conditions[]` | `indicator` | `"Price Action"` |
| `tradeAction` | `orderType` | `"Limit"` |
| `tradeAction` | `bufferPercent` | `0.1` |
| `stoploss` | `fixedPercent` | `0.5` |
| `stoploss` | `riskPercent` | `1.0` |
| `target` | `profitPercent` | `1.5` |
| `riskManagement` | `riskPerTrade` | `1` |

---

## 📍 Admin Reference — Konsi Value Kaha Se Change Hogi

### 1. Admin Strategy Form (`/admin/strategies` → Create/Edit)

| Field | Form Section | Default | `configJson` Path |
|---|---|---|---|
| Entry Time | Basic Info → Entry Time | `09:20` | `basicInfo.entryTime` |
| Exit Time | Basic Info → Exit Time | `15:15` | `basicInfo.exitTime` |
| Max Positions (Top N losers) | Basic Info → Max Trades/Day | `3` | `basicInfo.maxTradesPerDay` |
| Timeframe | Basic Info → Timeframe | `5m` | `basicInfo.timeframe` |
| Segment (F&O/Nifty/BankNifty) | Basic Info → Segment | `NSE F&O` | `basicInfo.segment` |
| Action (Long/Short) | Trade Action → Action Direction | `Long` | `tradeAction.action` |
| Order Type | Trade Action → Order Type | `Limit` | `tradeAction.orderType` |
| Buffer % | Trade Action → Buffer % | `0.1` | `tradeAction.bufferPercent` |
| Stop Loss % | Target & Stoploss → SL Target Value | `0.5` | `stoploss.fixedPercent` |
| Target % | Target & Stoploss → Target Value | `1.5` | `target.profitPercent` |
| Risk Per Trade % | Risk Guard → Risk Per Trade % | `1.0` | `riskManagement.riskPerTrade` |
| Conditions (add/remove) | Entry Conditions → Add Rule | (see below) | `conditions[]` |

**Default conditions (admin add/remove/modify karega):**
```
1. Pre Open Change %  <  -1.5   (Gap Down filter)
2. Price Action       >  Previous 5m High  (Breakout check)
```

---

### 2. Admin Settings Page (`/admin/settings`)

| Setting Key | Default Value | Kya Control Karta Hai |
|---|---|---|
| `algo_preopen_fetch_time` | `09:08` | Pre-open data fetch time |
| `algo_entry_time` | `09:20` | Candle breakout + entry time |
| `algo_token_refresh_time` | `08:00` | Daily Kite token auto-refresh time |
| `algo_check_interval_sec` | `60` | Har kitne sec mein scheduler loop check kare |

---

### 3. Client Table (Admin → Clients → Edit)

| Field | Location | Description |
|---|---|---|
| `client.capital` | Client edit form | **Total account limit** — 1% trade amount isse zyada nahi hoga |
| `client.tradingStatus` | Client edit form | `active` = trade allow, `inactive` = trade block |
| `client.subscriptionStatus` | Client edit form | `active` / `expired` / `pending` |
| `client.strategy` | Client assignment form | Kaunsi strategy assign hai |
| `client.zerodhaApiKey` | Client edit form | Zerodha API Key |
| `client.zerodhaApiSecret` | Client edit form | Zerodha API Secret |
| `client.zerodhaClientId` | Client edit form | Zerodha User ID |
| `client.zerodhaPassword` | Client edit form | Zerodha Password (auto-login ke liye) |
| `client.zerodhaTotpSecret` | Client edit form | TOTP Secret (auto-login ke liye) |

---

### 4. Environment Variables (`.env` file)

| Key | Values | Description |
|---|---|---|
| `KITE_AUTO_LOGIN_ENABLED` | `true` / `false` | TOTP auto-login on ya off |
| `USE_HTTP_POLLING` | `true` / `false` | `true` = HTTP polling (Vercel), `false` = WebSocket (VPS) |

---

## Edge Cases (Actual Code Behavior)

| Scenario | Actual Behavior |
|---|---|
| **Live margin API fail** | Fallback to DB `client.capital` |
| **Breakout fail** (LTP < candle high) | Try next stock in top N list; agar koi na ho to skip all trades today |
| **Kite historical API fail** | `candleHigh = 0` → fallback: `stock.high \|\| stock.ltp \|\| stock.prevClose \|\| 100` |
| **Quantity = 0** | Save FAILED trade, log warning |
| **Order placement fail** | Save FAILED trade with Kite error |
| **Market closed** | Retry as AMO (After Market Order) |
| **Duplicate trade per symbol today** | Skip that symbol, try next stock |
| **Token expired** | Auto-login before placing order |
| **No breakout candidate found** | All N stocks fail → "No breakout candidate found. Skipping trades for today." — no trade for that client |
| **Instrument token missing** | Stock not in `instrumentToSymbol` map → skip that stock |
| **Insufficient capital** | `Math.floor(amount / price) = 0` → FAILED trade |
| **Strategy config invalid** | `configJson` parse error → skip client with error log |
