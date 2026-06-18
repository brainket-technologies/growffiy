# Pre-Open Momentum Breakout — Pura Application Flow

> Yeh document batata hai ki **poora system kaise kaam karta hai** — admin kya change karega to kya hoga, strategy kaise apply hoti hai, aur ek real client ke saath exact example.

---

## 1. Yeh System Kya Hai?

Ek **automatic trading system** jo har din:

1. **09:08 AM** — NSE se pre-open data fetch karta hai
2. **09:15 AM** — Sabse zyada girne wala F&O stock select karta hai
3. **09:15-09:20** — Market open hota hai, 5-min candle banti hai
4. **09:20 AM** — Candle high check karta hai → breakout hua? → LIMIT BUY order lagata hai
5. **09:20-15:15** — Har 60 second monitor karta hai → SL ya Target hit? → SELL

**Zerodha Kite API** ke through orders lagte hain.

---

## 2. Simple Flow (Bina Technical Detail)

```
⏰ 08:00 → Token refresh (Zerodha session)
⏰ 09:08 → NSE se saare stocks ka pre-open data aaya
⏰ 09:15 → F&O stocks filter → sort → position #1 select → Map me store
⏰ 09:15-09:20 → Market open → 5-min candle bani
⏰ 09:20 → Candle high check → breakout? → BUY order
⏰ 09:20-15:15 → Price monitor → SL/Target? → SELL
```

---

## 3. Database — Current State (June 2026)

### 3.1 App Settings (Algo Timings)

| Setting Key | Value | Admin Kahan Change Karega | Effect |
|---|---|---|---|
| `algo_preopen_fetch_time` | **09:08** | Admin → App Settings page | Is time pe NSE se data fetch hoga. 09:08 karo ya 09:10 |
| `algo_entry_time` | **09:20** | Admin → App Settings page | Is time pe trade execute hogi. 09:20 karo ya 09:25 |
| `algo_token_refresh_time` | **08:00** | Admin → App Settings page | Is time pe Zerodha session refresh hoga |
| `algo_check_interval_sec` | **60** | Admin → App Settings page | Har kitne second monitor karna hai (60 = 1 min) |

### 3.2 Strategy Config (Pre Open Momentum Breakout)

| Section | Field | Current Value | Admin Kahan Change Karega | Effect |
|---|---|---|---|---|
| **basicInfo** | `name` | "Pre-Open Momentum Breakout" | Admin → Strategy → Edit Name | Sirf display name |
| | `segment` | **NSE F&O** | Admin → Strategy → Basic Info → Segment | Kaunse stocks filter honge. NSE F&O = sirf F&O stocks. Nifty 50 = sirf Nifty stocks |
| | `entryTime` | **09:20** | Admin → Strategy → Timing → Entry Time | Kitne baje trade karni hai |
| | `preSelectTime` | **09:15** | Admin → Strategy → Timing → Pre-Select Time | Kitne baje stock select karna hai |
| | `exitTime` | **15:15** | Admin → Strategy → Timing → Exit Time | Market close time |
| | `selectPosition` | **1** | Admin → Strategy → Trade Selection → Select Position | Kaunsa rank pick karna hai. 1 = biggest loser, 2 = second biggest loser |
| | `maxTradesPerDay` | **3** | Admin → Strategy → Trade Selection → Max Trades/Day | Max kitne trade ek din me |
| | `status` | **active** | Admin → Strategy → Status toggle | active = trade chalega, inactive = nahi chalega |
| **tradeAction** | `action` | **Long** | Admin → Strategy → Trade Action → Action Direction | Long = losers me se pick. Short = gainers me se pick |
| | `orderType` | **Limit** | Admin → Strategy → Trade Action → Order Type | Limit = specific price pe order. Market = market price pe |
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

#### ⏰ 08:00 — Token Refresh

| Detail | Value |
|---|---|
| Kya hua? | KITE_AUTO_LOGIN_ENABLED check hua |
| Result | Agar true hai → TOTP generate → Zerodha login → naya accessToken |
| DB me kya hua? | client.accessToken update |
| Admin kya change karega? | `algo_token_refresh_time` app setting (default 08:00) |

---

#### ⏰ 09:08 — Pre-Open Data Fetch

| Detail | Value |
|---|---|
| Kya hua? | NSE API call → 200+ stocks ka data aaya |
| Kahan store hua? | `preOpenCache[]` (RAM) + `PRE_OPEN_QUOTES_DATA` (DB app_settings) |
| Admin kya change karega? | `algo_preopen_fetch_time` app setting |

---

#### ⏰ 09:15 — Stock Selection (Stage 1.5)

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

#### ⏰ 09:20 — Trade Execution (Stage 2)

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

orderType = "Limit" → LIMIT order at ₹196.99

📌 ADMIN CHANGE KARE TO KYA HOGA:
  fixedPercent = 1.0% → SL = 196.99 × 0.99 = ₹195.02 (zyada room)
  profitPercent = 2.0% → Target = 196.99 × 1.02 = ₹200.93
  trailingSL = 0 → trailing band (fixed SL)
  orderType = "Market" → MARKET order (entry price guarantee nahi)

STEP 9: PLACE ORDER ON ZERODHA
────────────────────────────────
Kite.placeOrder({
  exchange: "NSE",
  tradingsymbol: "HINDALCO",
  transaction_type: "BUY",
  quantity: 40,
  order_type: "LIMIT",
  price: 196.99,
  product: "MIS",
  validity: "DAY"
})

→ Response: { status: "success", data: { order_id: "240619000123456" } }
→ Order placed ✅

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

#### ⏰ 09:20-15:15 — Monitoring (Har 60 Sec)

```
startActiveTradesMonitoringScheduler() — har 60 second chalta hai

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
|---|---|---|---|
| **Segment** → Nifty 50 | NSE F&O | Nifty 50 | F&O stocks nahi, Nifty 50 stocks filter honge |
| **selectPosition** → 2 | 1 | 2 | Biggest loser nahi, second biggest loser pick hoga |
| **action** → Short | Long | Short | Losers nahi, gainers me se pick hoga |
| **orderType** → Market | Limit | Market | Specific price pe order nahi, market price pe order |
| **bufferPercent** → 0.5% | 0.1% | 0.5% | Entry price candle high se 0.5% upar hoga (0.1% nahi) |
| **fixedPercent** (SL) → 1% | 0.5% | 1.0% | SL zyada door hoga → loss zyada ho sakta hai par trade zyada door nahi lagega |
| **profitPercent** → 2% | 1.5% | 2.0% | Target zyada door → bada profit but time lagega |
| **riskPerTrade** → 2% | 1% | 2% | Double amount allocate hoga → double profit/loss |
| **trailingSL** → 0% (off) | 0.2% | 0 | Trailing band → fixed SL (price upar jayega to SL nahi hilega) |
| **preSelectTime** → 09:10 | 09:15 | 09:10 | Stock selection 5 min pehle hoga |
| **algo_entry_time** → 09:25 | 09:20 | 09:25 | Trade 5 min late lagegi (zyada candle data) |
| **algo_preopen_fetch_time** → 09:10 | 09:08 | 09:10 | Pre-open data 2 min late aayega |
| **client.capital** → 1,00,000 | 50,000 | 1,00,000 | Zyada amount cap → zyada shares |
| **conditions** → add filter | [] | [{Pre Open Change % < -1.5}] | Sirf -1.5%+ girne wale stocks pick honge |

---

## 7. Algo Engine — Strategy Apply Kaise Hoti Hai (Complete Code Logic)

```
executePreOpenTrades() — Har client ke liye:

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
│    "Limit" → LIMIT order at entryPrice                     │
│    "Market" → MARKET order                                  │
│    "SL-Limit" → SL order with trigger at entryPrice        │
├─────────────────────────────────────────────────────────────┤
│ 8. SL/TARGET                                                │
│    SL% = config.stoploss.fixedPercent                      │
│    SL₹ = entryPrice × (1 - SL%/100)                        │
│    Target% = config.target.profitPercent                   │
│    Target₹ = entryPrice × (1 + Target%/100)                │
├─────────────────────────────────────────────────────────────┤
│ 9. MONITOR (har 60 sec)                                    │
│    Kite se latest price fetch                              │
│    Trailing SL = config.stoploss.trailingSL                │
│    Trailing Target = config.target.trailingTarget          │
│    currentPrice <= SL? → SELL                              │
│    currentPrice >= Target? → SELL                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Ek Hi Page Mein — Quick Summary

```
⏰ TIMING (Admin App Settings se change)
─────────────────────────────────────────
08:00 → Token refresh (algo_token_refresh_time)
09:08 → Pre-open fetch (algo_preopen_fetch_time)
09:15 → Stock select  (preSelectTime from strategy config)
09:20 → Trade execute (algo_entry_time)
09:20-15:15 → Monitor (algo_check_interval_sec)

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
Strategy: Pre Open Momentum Breakout
Client:   RZJ500 (capital ₹50,000)
Segment:  NSE F&O
Position: #1 Loser (selectPosition = 1)
Entry:    LIMIT @ candle high + 0.1%
Amount:   1% of live balance (capped at ₹50,000)
SL:       0.5% trailing (0.2% trail)
Target:   1.5% trailing (0.5% trail)
Conditions: None (empty)
```
