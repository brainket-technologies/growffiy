# Pre-Open Momentum Breakout — Pura Application Flow

> Yeh document batata hai ki **poora system kaise kaam karta hai** — admin kya change karega to kya hoga, strategy kaise apply hoti hai, aur ek real client ke saath exact example.

---

## 1. Yeh System Kya Hai?

Ek **automatic trading system** jo har din:

1. **09:08 AM** — NSE se pre-open data fetch karta hai (global timing)
2. **09:15 AM** — Sabse zyada girne wala F&O stock select karta hai (per-strategy timing)
3. **09:15-09:20** — Market open hota hai, 5-min candle banti hai
4. **09:20 AM** — Candle high check karta hai → breakout hua? → LIMIT BUY order lagata hai (per-strategy timing)
5. **09:20-15:15** — Strategy ke `checkIntervalSec` ke hisaab se monitor karta hai → SL ya Target hit? → SELL

**Zerodha Kite API** ke through orders lagte hain.

---

## 2. Simple Flow (Bina Technical Detail)

```
⏰ 08:00 → Token refresh (Zerodha session) — global
⏰ 09:08 → NSE se saare stocks ka pre-open data aaya — global
⏰ 09:15 → F&O stocks filter → sort → position #1 select → Map me store — per strategy
⏰ 09:15-09:20 → Market open → 5-min candle bani
⏰ 09:20 → Candle high check → breakout? → BUY order — per strategy
⏰ 09:20-15:15 → Price monitor (per strategy checkIntervalSec) → SL/Target? → SELL
```

---

## 3. Database — Current State (June 2026)

### 3.1 App Settings (Global Algo Timings — Infrastructure)

| Setting Key | Value | Admin Kahan Change Karega | Effect |
|---|---|---|---|
| `algo_preopen_fetch_time` | **09:08** | Admin → Settings → Algo Timings tab | Is time pe NSE se data fetch hoga |
| `algo_token_refresh_time` | **08:00** | Admin → Settings → Algo Timings tab | Is time pe Zerodha session refresh hoga |

### 3.2 Strategy Config (Pre Open Momentum Breakout) — `strategy.configJson` column

| Section | Field | Current Value | Admin Kahan Change Karega | Effect |
|---|---|---|---|---|
| **basicInfo** | `name` | "Pre-Open Momentum Breakout" | Admin → Strategy → Edit Name | Sirf display name |
| | `segment` | **NSE F&O** | Admin → Strategy → Basic Info → Segment | Kaunse stocks filter honge. NSE F&O = sirf F&O stocks. Nifty 50 = sirf Nifty stocks |
| | `entryTime` | **09:20** | Admin → Strategy → Timing → Entry Time | Kitne baje trade karni hai (per strategy) |
| | `preSelectTime` | **09:15** | Admin → Strategy → Timing → Pre-Select Time | Kitne baje stock select karna hai (per strategy) |
| | `exitTime` | **15:15** | Admin → Strategy → Timing → Exit Time | Market close time |
| | `selectPosition` | **1** | Admin → Strategy → Trade Selection → Select Position | Kaunsa rank pick karna hai. 1 = biggest loser, 2 = second biggest loser |
| | `maxTradesPerDay` | **3** | Admin → Strategy → Trade Selection → Max Trades/Day | Max kitne trade ek din me |
| | `checkIntervalSec` | **60** | Admin → Strategy → Trade Selection → Check Interval (sec) | Har kitne second monitor karna hai is strategy ke trades ke liye |
| | `status` | **active** | Admin → Strategy → Status toggle | active = trade chalega, inactive = nahi chalega |
| **tradeAction** | `action` | **Long** | Admin → Strategy → Trade Action → Action Direction | Long = losers me se pick. Short = gainers me se pick |
| | `orderType` | **SL-Market** | Admin → Strategy → Trade Action → Order Type | SL-M = trigger price pe market order. Limit = specific price. SL-Limit = trigger + limit |
| | `bufferPercent` | **0.1%** | Admin → Strategy → Trade Action → Buffer % | Candle high se kitna upar entry price rakhna hai |
| **stoploss** | `fixedPercent` | **0.5%** | Admin → Strategy → Stoploss section | Entry price se kitna neeche SL rakhna hai |
| | `trailingSL` | **0.2%** | Admin → Strategy → Stoploss section | Trailing SL kitna gap rakhna hai |
| **target** | `profitPercent` | **1.5%** | Admin → Strategy → Target section | Entry price se kitna upar target rakhna hai |
| | `trailingTarget` | **0.5%** | Admin → Strategy → Target section | Trailing target kitna gap rakhna hai |
| **riskManagement** | `riskPerTrade` | **1%** | Admin → Strategy → Risk Management | Live balance ka kitna % ek trade me lagana hai |
| | `capitalAllocation` | **10** | Admin → Strategy → Risk Management | (reserved) |
| **conditions** | `conditions` | **[] empty** | Admin → Strategy → Conditions builder | Extra filter conditions. Abhi koi nahi hai |

---

## 4. Real Example — Client RZJ500

### 4.1 Client Details

```
Client ID:     b364d72f-e2e2-4dbc-bbef-3286c75e1875
Zerodha ID:    RZJ500
Capital (DB):  ₹50,000 (yeh cap hai — isse zyada amount allocate nahi hoga)
Risk %:        1%
Status:        Active | Subscription: Active
Strategy:      Pre Open Momentum Breakout (c7bafa89)
```

### 4.2 NSE Pre-Open Data (Example — 19 June 2026)

```
NSE se 200+ stocks ka data aaya.
Sirf F&O stocks niche dikhaye gaye hain.

Symbol        PrevClose    IEP (LTP)    Change%    isFo
────────────────────────────────────────────────────────
HINDALCO       200.00      191.60       -4.20%     YES
TATASTEEL      150.00      144.75       -3.50%     YES
JSWSTEEL       800.00      780.00       -2.50%     YES
BHARTIARTL     500.00      491.00       -1.80%     YES
RELIANCE      2500.00     2470.00       -1.20%     YES
HDFCBANK      1600.00     1590.00       -0.62%     YES
SBIN           600.00      598.00       -0.33%     YES
ICICIBANK     1000.00     1003.00       +0.30%     YES
INFY          1500.00     1515.00       +1.00%     YES
TCS           3500.00     3550.00       +1.43%     YES
```

### 4.3 Step-by-Step Execution

---

#### ⏰ 08:00 — Token Refresh (Global)

| Detail | Value |
|---|---|
| Kya hua? | KITE_AUTO_LOGIN_ENABLED check hua |
| Result | Agar true hai → TOTP generate → Zerodha login → naya accessToken |
| DB me kya hua? | client.accessToken update |
| Admin kya change karega? | `algo_token_refresh_time` app setting → Admin → Settings → Algo Timings tab |

---

#### ⏰ 09:08 — Pre-Open Data Fetch (Global)

| Detail | Value |
|---|---|
| Kya hua? | NSE API call → 200+ stocks ka data aaya |
| Kahan store hua? | `preOpenCache[]` (RAM) + `PRE_OPEN_QUOTES_DATA` (DB app_settings) |
| Admin kya change karega? | `algo_preopen_fetch_time` app setting → Admin → Settings → Algo Timings tab |

---

#### ⏰ XX:XX — Stock Selection (Stage 1.5 — Per Strategy)

> Har strategy ka apna `preSelectTime` hota hai (configJson → basicInfo.preSelectTime).
> Default 09:15 hai, lekin aap alag strategy ke liye alag time rakh sakte hain.
> Algo engine har 60 sec check karta hai ki kya kisi strategy ka preSelectTime match karta hai.

```
🔍 STEP 1: SEGMENT FILTER
─────────────────────────────
Config: segment = "NSE F&O"
Action: stocks.filter(s => s.isFo === true)
Result: sirf 10 F&O stocks bache (upar wale)

🔍 STEP 2: CONDITIONS FILTER
─────────────────────────────
Config: conditions = [] (empty)
Action: koi filter nahi
Result: saare 10 F&O stocks pass

🔍 STEP 3: SORT
─────────────────────────────
Config: action = "Long"
Action: ascending by changePercent (sabse zyada negative pehle)
Result:
  Rank 1: HINDALCO   -4.20%   ← sortedStocks[0]
  Rank 2: TATASTEEL  -3.50%   ← sortedStocks[1]
  Rank 3: JSWSTEEL   -2.50%   ← sortedStocks[2]
  Rank 4: BHARTIARTL -1.80%   ← sortedStocks[3]
  ...

🔍 STEP 4: PICK POSITION
─────────────────────────────
Config: selectPosition = 1
Action: sortedStocks[0] lo
Result: HINDALCO selected ✅

🔍 STEP 5: STORE
─────────────────────────────
Action: RAM Map me store
  Map.set("b364d72f", HINDALCO stock data)
Result: HINDALCO client RZJ500 ke liye reserved

📌 ADMIN CHANGE KARE TO KYA HOGA:
────────────────────────────────────────
selectPosition = 2 → sortedStocks[1] = TATASTEEL select hoga
segment = "Nifty 50" → Nifty 50 stocks filter honge, F&O nahi
conditions = [{Pre Open Change %, <, -1.5}] → sirf -1.5%+ girne wale pass
action = "Short" → ascending nahi, descending sort hoga (gainers pehle)
```

---

#### ⏰ 09:15-09:20 — 5-Min Candle Build

```
Market open 09:15. HINDALCO ki 5-min candle bani:

Time      Price
────────────────
09:15     ₹191.60  ← open
09:16     ₹193.00
09:17     ₹194.50
09:18     ₹196.80  ← HIGH
09:19     ₹195.50
09:20     ₹200.20  ← current LTP

5-min candle: [open=191.60, HIGH=196.80, low=191.00, close=195.50]
```

---

#### ⏰ XX:XX — Trade Execution (Stage 2 — Per Strategy)

> Har strategy ka apna `entryTime` hota hai (configJson → basicInfo.entryTime).
> Default 09:20 hai. Algo engine har 60 sec check karta hai ki kya kisi strategy ka entryTime match karta hai,
> aur sirf us strategy ke clients ke liye trade execute karta hai.

```
═══════════════════════════════════════════════════════
CLIENT: RZJ500 | STOCK: HINDALCO | DATE: 19 June 2026
═══════════════════════════════════════════════════════

STEP 1: PRESELECTED MAP CHECK
────────────────────────────────
Map.get("b364d72f") = HINDALCO ✅
→ Map se delete (ek baar use kiya)

STEP 2: EXISTING TRADE CHECK
────────────────────────────────
prisma.trade.findFirst({ clientId, strategyId, symbol: HINDALCO, today })
→ Nahi mila → continue ✅

STEP 3: 5-MIN CANDLE FETCH
────────────────────────────────
Kite API: getHistoricalData(token, "5minute", "09:15", "09:20")
→ 1 candle: [..., 191.60, 196.80, 191.00, 195.50, ...]
→ candleHigh = 196.80

STEP 4: ENTRY PRICE
────────────────────────────────
bufferPercent = 0.1% (config se)
entryPrice = 196.80 × (1 + 0.1/100)
           = 196.80 × 1.001
           = ₹196.99

STEP 5: BREAKOUT CHECK
────────────────────────────────
currentLTP = 200.20 (live price from Kite)
hasPriceAction = config.conditions me "Price Action" hai? → ❌ Nahi (empty)

!hasPriceAction = true → automatic BREAKOUT ✅
(target stock HINDALCO)

📌 AGAR CONDITION HOTI:
  hasPriceAction = true
  tab: 200.20 >= 196.80? → ✅ BREAKOUT (LTP ne high toda)
  agar: 195.00 >= 196.80? → ❌ NO BREAKOUT (skip)

STEP 6: KITE SESSION
────────────────────────────────
client.accessToken exists? → ✅ Ha
→ auto-login needed nahi

STEP 7: POSITION SIZING
────────────────────────────────
Kite.getMargins() → net equity = ₹8,00,000 (Zerodha account me total balance)

riskPerTrade = 1% (config se)
allocatedAmount = 8,00,000 × 1/100 = ₹8,000

client.capital = ₹50,000 (DB se — yeh cap hai)
finalAmount = min(8000, 50000) = ₹8,000

qty = floor(8000 / 196.99) = 40 shares

📌 ADMIN CHANGE KARE TO KYA HOGA:
  riskPerTrade = 2% → allocated = 8,00,000 × 2% = ₹16,000
  client.capital = ₹1,00,000 → cap increase
  Dono se final amount badega → zyada shares

STEP 8: STOP LOSS & TARGET
────────────────────────────────
SL% = 0.5% (config se)
SL₹ = 196.99 × (1 - 0.5/100) = 196.99 × 0.995 = ₹196.00

Target% = 1.5% (config se)
Target₹ = 196.99 × (1 + 1.5/100) = 196.99 × 1.015 = ₹200.02

Trailing SL = 0.2% (price upar jayega to SL bhi upar aayega)
Trailing Target = 0.5% (price upar jayega to Target bhi upar aayega)

orderType = "SL-Market" → SL-M order at trigger ₹196.99 (market fill after trigger)

📌 ADMIN CHANGE KARE TO KYA HOGA:
  fixedPercent = 1.0% → SL = 196.99 × 0.99 = ₹195.02 (zyada room)
  profitPercent = 2.0% → Target = 196.99 × 1.02 = ₹200.93
  trailingSL = 0 → trailing band (fixed SL)
  orderType = "Limit" → LIMIT order (exact price guarantee, may not fill)
  orderType = "Market" → MARKET order (instant fill, no price control)

STEP 9: PLACE ORDER ON ZERODHA
────────────────────────────────
Kite.placeOrder({
  exchange: "NSE",
  tradingsymbol: "HINDALCO",
  transaction_type: "BUY",
  quantity: 40,
  order_type: "SL-M",          // ← SL-Market: trigger pe market order
  trigger_price: 196.99,       // ← Jab price 196.99 tak aayega tab fill hoga
  product: "MIS",
  validity: "DAY"
})

→ Response: { status: "success", data: { order_id: "240619000123456" } }
→ Order placed ✅ (trigger waiting for price to hit ₹196.99)

STEP 10: SAVE TRADE IN DATABASE
────────────────────────────────
prisma.trade.create({
  clientId: "b364d72f...",
  strategyId: "c7bafa89...",
  symbol: "HINDALCO",
  orderType: "MIS",
  entryPrice: 196.99,
  quantity: 40,
  stopLoss: 196.00,
  target: 200.02,
  status: "OPEN"
})

STEP 11: LOGS
────────────────────────────────
prisma.strategyLog.create({ message: "Bought 40 HINDALCO @ 196.99..." })
prisma.auditLog.create({ action: "AUTO TRADE INITIATED", ... })
```

---

#### ⏰ 09:20-15:15 — Monitoring (Per-Strategy Check Interval)

> Har strategy ka apna `checkIntervalSec` hota hai (configJson → basicInfo.checkIntervalSec).
> Default 60 hai. Engine ka base timer har 10 sec chalta hai, lekin har trade ko sirf apni strategy ke
> interval ke hisaab se check karta hai. Example: checkIntervalSec=120 → har 2 min check.

```
startActiveTradesMonitoringScheduler() — base timer har 10 sec, per-trade filtering

─────────────────────────────────────────────────────────────
SCENARIO 1: ✅ TARGET HIT (PROFIT)
─────────────────────────────────────────────────────────────

Time: 09:21 (1 minute baad)
────────────────────────────────
Kite se latest candle fetch:
  currentPrice = latestCandle[4] = ₹201.00

SL Check:  201.00 <= 196.00? → ❌ Nahi (no SL)
Target Check: 201.00 >= 200.02? → ✅ HA!

→ MARKET SELL 40 HINDALCO @ 201.00
→ Trade status: "closed"
→ P&L = (201.00 - 196.99) × 40 = ₹160.40 PROFIT ✅

Log: "Sold 40 shares of HINDALCO at ₹201.00 due to Target (1.5%) hit. P&L: ₹160.40"

📌 ISKA MATLAB:
  ₹8,000 lagaye → ₹160.40 profit (2% return on deployed capital in 1 min)
  Agar riskPerTrade = 2% hota → ₹16,000 lagte → ₹320.80 profit

─────────────────────────────────────────────────────────────
SCENARIO 2: ❌ STOP LOSS HIT (LOSS)
─────────────────────────────────────────────────────────────

Time: 10:30 AM
────────────────────────────────
currentPrice = ₹195.50

SL Check:  195.50 <= 196.00? → ✅ HA!
Target Check: 195.50 >= 200.02? → ❌ Nahi

→ MARKET SELL 40 HINDALCO @ 196.00 (SL price)
→ Trade status: "closed"
→ P&L = (196.00 - 196.99) × 40 = -₹39.60 LOSS ❌

Log: "Sold 40 shares of HINDALCO at ₹196.00 due to Stop Loss (0.5%) hit. P&L: -₹39.60"

📌 ISKA MATLAB:
  ₹39.60 loss → 0.5% of ₹8,000 = ₹40 (exact risk)
  Yeh hi hota hai risk management — small loss, big profit

─────────────────────────────────────────────────────────────
SCENARIO 3: 🔄 TRAILING SL ACTIVE (BIG PROFIT)
─────────────────────────────────────────────────────────────

Price trend:
  09:30 → ₹205  → SL trail: 205 × 0.998 = ₹204.59
  10:00 → ₹215  → SL trail: 215 × 0.998 = ₹214.57
  11:00 → ₹225  → SL trail: 225 × 0.998 = ₹224.55
  11:30 → ₹220  → Price neeche aaya

SL Check:  220 <= 224.55? → ✅ HA! (trailing SL hit)
→ SELL @ 224.55 (trailing SL price)
→ P&L = (224.55 - 196.99) × 40 = ₹1,102.40 PROFIT 🚀

📌 TRAILING SL KA FAIDA:
  Fixed SL hota to ₹196.00 pe hit hota → ₹39.60 loss
  Trailing SL ne price ko follow kiya → ₹1,102 profit
  Difference: ₹1,142

─────────────────────────────────────────────────────────────
SCENARIO 4: TRAILING TARGET ACTIVE
─────────────────────────────────────────────────────────────

Price trend:
  09:30 → ₹205  → Target trail: 205 × 1.005 = ₹206.03
  10:00 → ₹210  → Target trail: 210 × 1.005 = ₹211.05
  11:00 → ₹215  → Target trail: 215 × 1.005 = ₹216.08
  11:30 → ₹220  → Target trail: 220 × 1.005 = ₹221.10

Target Check: 220 >= 221.10? → ❌ (abhi nahi)
Jab price 221.10 tak jayega tab target hit hoga.
```

---

## 5. Conditions — Kaise Apply Hoti Hain

### Current: `conditions: []` (Empty — No Filter)

```
Algo Engine Code:

if (config.conditions && Array.isArray(config.conditions)) {
  for (const cond of config.conditions) {
    // conditions array empty → loop zero times → koi filter nahi
  }
}

→ Saare F&O stocks pass karte hain
→ Sirf segment filter lagta hai (NSE F&O)
```

### Example 1: Admin Adds Condition

Admin form me add kare:

| Logical | Indicator | Operator | Value |
|---|---|---|---|
| AND | Pre Open Change % | < | -1.5 |

```
Algo Engine Code:

for (const cond of config.conditions) {
  if (cond.indicator === 'Pre Open Change %') {
    const val = Number(cond.value);  // val = -1.5
    if (cond.operator === '<' && !(stock.changePercent < -1.5)) return false;
  }
}

→ Stock check:
  HINDALCO  -4.20% → -4.20 < -1.5? → ✅ pass
  RELIANCE  -1.20% → -1.20 < -1.5? → ❌ reject

→ Result: 7 F&O stocks → 4 pass → sorted → #1 HINDALCO select
```

### Example 2: Two Conditions (AND)

| Logical | Indicator | Operator | Value |
|---|---|---|---|
| AND | Pre Open Change % | < | -1.5 |
| AND | Price Action | >= | Previous 5m High |

```
Algo Engine Code:

for (const cond of config.conditions) {
  // Condition 1
  if (cond.indicator === 'Pre Open Change %') {
    if (!(stock.changePercent < -1.5)) return false;
  }
  // Condition 2
  if (cond.indicator === 'Price Action') {
    const prevHigh = stock.high || stock.prevClose || stock.ltp;
    if (!(stock.ltp >= prevHigh)) return false;
  }
}

→ Stock check:
              change%  pass #1?  LTP vs High  pass #2?  Result
  HINDALCO   -4.20%   ✅        191 < 197    ❌        ❌
  TATASTEEL  -3.50%   ✅        200 >= 200   ✅        ✅ ← #1
  JSWSTEEL   -2.50%   ✅        785 >= 780   ✅        ✅ ← #2

→ Sirf 2 stocks bache → sorted → #1 TATASTEEL select
```

### Bypassed Indicators (Code me nahi hai)

```
Admin form me yeh sab add kar sakta hai, lekin code inhe IGNORE karega:
  Gap Down, RSI, EMA, SMA, VWAP, MACD, SuperTrend, ADX,
  Volume, Open Interest, Previous High/Low/Close, Gap Up,
  Pre Open Price, Pre Open Volume, ATR, Bollinger Bands

Kyun? Code me sirf do conditions ka handler hai:
  ✓ Pre Open Change %  (line 800-808)
  ✓ Price Action        (line 809-814)
  ✗ Baaki sab → koi else-if branch nahi → auto skip
```

---

## 6. Admin Value Change → Kya Effect Hoga (Quick Reference)

| Admin Change | Current Value | Naya Value | Effect |
|---|---|---|---|---|
| **Segment** → Nifty 50 | NSE F&O | Nifty 50 | F&O stocks nahi, Nifty 50 stocks filter honge |
| **selectPosition** → 2 | 1 | 2 | Biggest loser nahi, second biggest loser pick hoga |
| **action** → Short | Long | Short | Losers nahi, gainers me se pick hoga |
| **orderType** → Market | Limit | Market | Specific price pe order nahi, market price pe order |
| **bufferPercent** → 0.5% | 0.1% | 0.5% | Entry price candle high se 0.5% upar hoga (0.1% nahi) |
| **fixedPercent** (SL) → 1% | 0.5% | 1.0% | SL zyada door hoga → loss zyada ho sakta hai par trade zyada door nahi lagega |
| **profitPercent** → 2% | 1.5% | 2.0% | Target zyada door → bada profit but time lagega |
| **riskPerTrade** → 2% | 1% | 2% | Double amount allocate hoga → double profit/loss |
| **trailingSL** → 0% (off) | 0.2% | 0 | Trailing band → fixed SL (price upar jayega to SL nahi hilega) |
| **entryTime** (per-strategy) → 09:25 | 09:20 | 09:25 | Sirf is strategy ki trade 5 min late lagegi |
| **preSelectTime** (per-strategy) → 09:10 | 09:15 | 09:10 | Sirf is strategy ka stock selection 5 min pehle hoga |
| **checkIntervalSec** (per-strategy) → 120 | 60 | 120 | Sirf is strategy ke trades har 2 min monitor honge |
| **algo_preopen_fetch_time** (global) → 09:10 | 09:08 | 09:10 | Saari strategies ke liye pre-open data 2 min late aayega |
| **algo_token_refresh_time** (global) → 07:30 | 08:00 | 07:30 | Saari strategies ke liye token 30 min pehle refresh hoga |
| **client.capital** → 1,00,000 | 50,000 | 1,00,000 | Zyada amount cap → zyada shares |
| **conditions** → add filter | [] | [{Pre Open Change % < -1.5}] | Sirf -1.5%+ girne wale stocks pick honge |

---

## 7. Algo Engine — Scheduler Flow (Per-Strategy Timing)

```
SCHEDULER LOOP — har 60 second:

┌──────────────────────────────────────────────────────────────┐
│ 1. GLOBAL: Pre-open fetch                                   │
│    currentTime == algo_preopen_fetch_time?                   │
│    → fetch NSE data (once for all strategies)               │
├──────────────────────────────────────────────────────────────┤
│ 2. PER-STRATEGY LOOP                                        │
│    for each active strategy:                                │
│      read configJson → basicInfo.{preSelectTime, entryTime} │
│                                                              │
│      if currentTime == strategy.preSelectTime AND not done: │
│        → preSelectAllClients(strategy.id)                    │
│        → filter → sort → pick position → Map store          │
│                                                              │
│      if currentTime == strategy.entryTime AND not done:     │
│        → executePreOpenTrades(adminId, undefined, strategy.id)│
│        → sirf is strategy ke clients process hote hain       │
└──────────────────────────────────────────────────────────────┘
```

```
executePreOpenTrades(strategyId?) — Har client ke liye:

┌─────────────────────────────────────────────────────────────┐
│ 1. strategy.configJson READ                                 │
│    → config = JSON.parse(strategy.configJson)               │
│    → Isme saari settings hain (basicInfo, tradeAction, etc) │
├─────────────────────────────────────────────────────────────┤
│ 2. SEGMENT FILTER                                           │
│    segment = config.basicInfo.segment → "NSE F&O"          │
│    sirf F&O stocks rakho                                    │
├─────────────────────────────────────────────────────────────┤
│ 3. CONDITIONS FILTER                                        │
│    config.conditions array loop                             │
│    → Pre Open Change %? → compare changePercent            │
│    → Price Action? → compare ltp vs high                   │
│    → Baaki? → ignore                                       │
├─────────────────────────────────────────────────────────────┤
│ 4. SORT + SELECT                                            │
│    action = config.tradeAction.action                       │
│    Long? → ascending sort (losers first)                   │
│    Short? → descending sort (gainers first)                │
│    selectPosition = config.basicInfo.selectPosition        │
│    stock = sortedStocks[selectPosition - 1]                │
├─────────────────────────────────────────────────────────────┤
│ 5. CANDLE BREAKOUT                                         │
│    Kite API se 5-min candle fetch                          │
│    candle[2] = HIGH                                         │
│    bufferPercent = config.tradeAction.bufferPercent         │
│    entryPrice = candleHigh × (1 + bufferPercent/100)       │
│    LTP >= candleHigh? → BREAKOUT ✅ → place order          │
├─────────────────────────────────────────────────────────────┤
│ 6. POSITION SIZING                                         │
│    Kite.getMargins() → liveBalance                         │
│    riskPerTrade = config.riskManagement.riskPerTrade       │
│    amount = liveBalance × (riskPerTrade/100)               │
│    cap = client.capital                                    │
│    finalAmount = min(amount, cap)                           │
│    qty = floor(finalAmount / entryPrice)                   │
├─────────────────────────────────────────────────────────────┤
│ 7. ORDER TYPE                                              │
│    config.tradeAction.orderType                             │
│    "SL-Market" → SL-M order, trigger=entryPrice (default)  │
│    "Limit" → LIMIT order at entryPrice                     │
│    "Market" → MARKET order                                  │
│    "SL-Limit" → SL order with trigger + limit price        │
├─────────────────────────────────────────────────────────────┤
│ 8. SL/TARGET                                                │
│    SL% = config.stoploss.fixedPercent                      │
│    SL₹ = entryPrice × (1 - SL%/100)                        │
│    Target% = config.target.profitPercent                   │
│    Target₹ = entryPrice × (1 + Target%/100)                │
├─────────────────────────────────────────────────────────────┤
│ 9. MONITOR (per-strategy checkIntervalSec)                  │
│    Kite se latest price fetch                               │
│    Trailing SL = config.stoploss.trailingSL                │
│    Trailing Target = config.target.trailingTarget          │
│    currentPrice <= SL? → SELL                              │
│    currentPrice >= Target? → SELL                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Ek Hi Page Mein — Quick Summary

```
⏰ TIMING
─────────────────────────────────────────
🌍 Global (Admin → Settings → Algo Timings):
  08:00 → Token refresh (algo_token_refresh_time)
  09:08 → Pre-open fetch (algo_preopen_fetch_time)

📋 Per-Strategy (Admin → Strategy → Basic Info → Timing):
  XX:XX → Stock select  (basicInfo.preSelectTime)
  XX:XX → Trade execute (basicInfo.entryTime)
  XX:XX → Monitor       (basicInfo.checkIntervalSec — default 60)

🔍 STOCK SELECTION (Admin Strategy Config se change)
─────────────────────────────────────────────────────
Segment filter   → basicInfo.segment
Conditions filter → conditions[] array
Sort             → tradeAction.action (Long/Short)
Pick position    → basicInfo.selectPosition

💰 TRADE EXECUTION (Admin Strategy Config se change)
─────────────────────────────────────────────────────
Entry price   → tradeAction.bufferPercent + candle high
Order type    → tradeAction.orderType (Limit/Market)
Amount        → riskManagement.riskPerTrade + client.capital
Quantity      → amount / entryPrice

🎯 EXIT (Admin Strategy Config se change)
───────────────────────────────────────────
Stop Loss     → stoploss.fixedPercent + trailingSL
Target        → target.profitPercent + trailingTarget

📊 CURRENT SETUP (19 June 2026)
────────────────────────────────
Global Timings:  08:00 token | 09:08 pre-open fetch
Strategy:        Pre Open Momentum Breakout
  preSelectTime: 09:15 | entryTime: 09:20 | checkIntervalSec: 60
Client:          RZJ500 (capital ₹50,000)
Segment:         NSE F&O
Position:        #1 Loser (selectPosition = 1)
Entry:           SL-Market @ trigger = candle high + 0.1%
Amount:          1% of live balance (capped at ₹50,000)
SL:              0.5% trailing (0.2% trail)
Target:          1.5% trailing (0.5% trail)
Conditions:      None (empty)
```

---

## 9. Real Client — Vikash Sharma (RZJ500) Live Wallet Flow

### 9.1 Client Details (Database se)

| Field | Value |
|---|---|
| **Name** | Vikash Sharma |
| **Zerodha ID** | RZJ500 |
| **Client ID (UUID)** | `b364d72f-e2e2-4dbc-bbef-3286c75e1875` |
| **Capital (DB me store)** | **₹50,000** — yeh ek **cap** hai, maximum limit |
| **Risk %** | 1% (strategy config se) |
| **Trading Status** | Active ✅ |
| **Subscription** | Active ✅ |
| **Strategy** | Pre-Open Momentum Breakout |
| **Zerodha API Key + Token** | Available ✅ (auto-login se aaya) |

### 9.2 Live Wallet Amount — Kaise Kaam Karta Hai

```
╔══════════════════════════════════════════════════════════════════╗
║                  📍 WHERE DOES THE MONEY COME FROM?              ║
╚══════════════════════════════════════════════════════════════════╝

Engine har trade se pehle Zerodha ka LIVE balance fetch karta hai:

  KiteClient.getMargins()  →  { equity: { net: 1709.80 } }

  Yeh Vikash ke Zerodha account ka REAL balance hai — ₹1,709.80

  Breakdown:
    cash (opening_balance):   ₹709.80
    intraday_payin:           ₹1,000.00  ← (today's added fund)
    ─────────────────────────────────────
    net:                      ₹1,709.80

  ⚠️  DB capital = ₹50,000 (yeh sirf ek MAX LIMIT cap hai)
  ⚠️  Real balance sirf ₹1,709.80 hai

  🔴 PROBLEM: 1% of ₹1,709.80 = ₹17.09
     ₹17.09 / ₹196.99 (entry price) = 0 shares
     → Trade SKIP ho jayegi (quantity 0)
     → Vikash ke account me trade lagaane ke liye paise nahi hai!
```

### 9.3 Position Sizing — Step by Step (Real Data)

```
┌──────────────────────────────────────────────────────────────────┐
│ STEP 1: LIVE BALANCE FETCH                                      │
├──────────────────────────────────────────────────────────────────┤
│ Kite.getMargins() → equity.net = ₹1,709.80                       │
│                                                                  │
│ 📌 Vikash ke Zerodha account mein total ₹1,709.80 hai           │
│    (₹709 cash + ₹1,000 intraday payin)                           │
├──────────────────────────────────────────────────────────────────┤
│ STEP 2: RISK PERCENT APPLY                                      │
├──────────────────────────────────────────────────────────────────┤
│ riskPerTrade = 1% (strategy config se)                           │
│ allocatedAmount = ₹1,709.80 × 1% = ₹17.09                       │
│                                                                  │
│ 📌 Sirf ₹17 allocate hoga — bahut kam!                          │
├──────────────────────────────────────────────────────────────────┤
│ STEP 3: DB CAP CHECK                                            │
├──────────────────────────────────────────────────────────────────┤
│ client.capital (DB) = ₹50,000                                    │
│ finalAmount = min(₹17.09, ₹50,000) = ₹17.09                     │
│                                                                  │
│ 📌 DB cap ₹50,000 hai lekin live balance hi ₹1,709 hai          │
│    Isliye cap irrelevant hai — live balance hi decide karega     │
├──────────────────────────────────────────────────────────────────┤
│ STEP 4: QUANTITY                                                │
├──────────────────────────────────────────────────────────────────┤
│ entryPrice = ₹196.99 (candle high + 0.1% buffer)                │
│ quantity = floor(₹17.09 / ₹196.99) = 0 ❌                        │
│                                                                  │
│ 📌 ENTRY PRICE (₹196.99) > ALLOCATED AMOUNT (₹17.09)            │
│    → Quantity 0 → Trade FAILED → SKIP                           │
│    → StrategyLog: "Calculated quantity is 0"                    │
│    → Trade status: "FAILED"                                     │
└──────────────────────────────────────────────────────────────────┘
```

### 9.4 Different Scenarios — Real Balance Comparison

```
╔═════════════════════════════════════════════════════════════════════╗
║  SCENARIO     LIVE BALANCE   1% ALLOCATION   DB CAP    QTY    TRADE║
║               (Zerodha)                          (50K)         ║
╠═════════════════════════════════════════════════════════════════════╣
║  A (REAL)     ₹1,709         ₹17             ₹50,000   0      ❌  ║
║  B (₹50K)     ₹50,000        ₹500            ₹50,000   2      ✅  ║
║  C (₹2L)      ₹2,00,000      ₹2,000          ₹50,000   10     ✅  ║
║  D (₹8L)      ₹8,00,000      ₹8,000          ₹50,000   40     ✅  ║
║  E (₹20L)     ₹20,00,000     ₹20,000         ₹50,000   101    ✅  ║
║  F (₹1Cr)     ₹1,00,00,000   ₹1,00,000       ₹50,000   253    ✅  ║ ← capped
╚═════════════════════════════════════════════════════════════════════╝

🔑 KEY TAKEAWAY:
  Vikash ke account me abhi sirf ₹1,709 hai → koi trade nahi lagegi.
  Admin ko chaahiye ki Vikash apne Zerodha account me paise add kare,
  ya admin DB capital badhane se kuch nahi hoga — live balance decide karta hai.
```

### 9.5 Admin Kya Change Kar Sakta Hai

| Admin Change | Effect |
|---|---|
| **DB capital ₹50,000 → ₹1,00,000** | ❌ Koi fark nahi. Live balance ₹1,709 hai — DB cap irrelevant |
| **riskPerTrade 1% → 10%** | ₹1,709 × 10% = ₹170 → qty = floor(170/196.99) = 0 ❌ Still skip |
| **riskPerTrade 1% → 100%** | ₹1,709 × 100% = ₹1,709 → qty = floor(1709/196.99) = 8 ✅ Trade lagegi |
| **Vikash Zerodha me paise daale** | ₹50,000 add → balance ₹51,709 → 1% = ₹517 → qty = 2 ✅ |

| Admin Kya Nahi Kar Sakta | Reason |
|---|---|
| DB capital badhake trade laga dena | Live balance Kite se aata hai, DB cap sirf limit hai. Agar Zerodha me paise nahi to trade nahi lagegi |

### 9.6 Trade Example — Agar Vikash Ke Account Me Paise Hote

```
═══════════════════════════════════════════════════════════════
CLIENT: Vikash Sharma (RZJ500) | DATE: 19 June 2026
═══════════════════════════════════════════════════════════════

📌 REALITY: Live Balance = ₹1,709 → TRADE SKIP ❌
📌 SCENARIO: Agar balance = ₹8,00,000 hota to:

Pre-Open Data:
  HINDALCO -4.20% → sortedStocks[0] → selected ✅
  
5-min Candle High: ₹196.80
Entry Price (SL-M trigger): ₹196.80 × 1.001 = ₹196.99

Kite.getMargins() → ₹8,00,000
1% = ₹8,000 → DB cap ₹50,000 → min(8000, 50000) = ₹8,000
Quantity: floor(8000 / 196.99) = 40 shares

✅ ORDER PLACED:
  BUY 40 HINDALCO @ SL-Market trigger ₹196.99
  SL: ₹196.00 (0.5% trailing)
  Target: ₹200.02 (1.5% trailing)

📊 VIKASH KA EXPOSURE (agar balance hota):
  Trade Value: 40 × ₹196.99 = ₹7,879.60
  Risk: 1% of ₹8,00,000 = ₹8,000 (max loss agar SL hit)
  Actual SL loss: 40 × ₹0.99 = ₹39.60 (agar ₹196.00 pe SL hit)
  Profit if target hit: 40 × ₹3.03 = ₹121.20
```
