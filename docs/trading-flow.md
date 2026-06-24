# Trading Flow — Pre-Open Momentum Breakout

## Database Values (Neon PostgreSQL)

### Strategy: Pre-Open Momentum Breakout
```
ID:     c7bafa89-3403-44c3-bcd0-199602c878e1
Status: active

entryTime:        "09:20:30"
preSelectTime:    "09:15:30"
exitTime:         "15:24:00"
selectPosition:   1 (weakest)
segment:          "NSE F&O"
exchange:         "NSE"
tradeType:        "Intraday" (MIS)
orderType:        "SL-Market"
action:           "Long"
bufferPercent:    0.1%
candlePriceType:  "high"

stoploss.fixedPercent:  1%
target.profitPercent:   2%

riskPerTrade:       3%
capitalAllocation:  -1 (DISABLED — only 3% risk used)
maxOpenPositions:   3
maxDailyLoss:       -1 (unlimited)
maxDailyProfit:     -1 (unlimited)

conditions: [] (empty — all stocks eligible)
```

### Client: Vikash Sharma
```
Kite ID:     RZJ500
Capital:     ₹5,00,000.00
Status:      active + active subscription
Strategy:    Pre-Open Momentum Breakout
```

### App Settings
```
algo_token_refresh_time: 08:00
algo_preopen_fetch_time: 09:08
algo_entry_time:         09:20:30
auto_trade_enabled:      true
isTradingActive:         true
```

---

## ⏰ 08:00 — Token Refresh

tradingScheduler.startDailyTokenRefreshScheduler() → 08:00 trigger

1. Query DB: active clients with accessToken
2. Vikash (RZJ500):
   - accessToken exists? Yes
   - Already refreshed today? No → login
   - performKiteAutoLogin(Vikash.id)
   - password + TOTP → Kite session → new access_token
   - DB update
   - todayTokenRefreshed.add(Vikash.id)

Total: 1 client → ~2 sec → **08:00:02 ✅**

---

## ⏰ 09:08 — Pre-Open Fetch

NSE API: `https://www.nseindia.com/api/market-data-pre-open?key=F&O`

2000+ stocks fetched → preOpenCache stored in memory

Single API call → ~5 sec → **09:08:05 ✅**

---

## ⏰ 09:15:30 — Pre-Select (SIRF EK BAAR, repeat nahi hogi)

tradingScheduler checks every 10s → jab time >= "09:15:30" ho jayega, **sirf ek baar** run hoga.

preSelectAllClients() called → **Har client ko jo strategy assign hai, uske according stock select hoga**

```
┌─ Vikash (RZJ500) ─────────────────────────────────────────┐
│  Assigned Strategy: "Pre-Open Momentum Breakout"           │
│  Segment: NSE F&O → Sort weakest → CANBK ✅               │
│  preselectedStockByStrategy["strat-id"] = CANBK            │
│  WebSocket: subscribe CANBK                                │
└─────────────────────────────────────────────────────────────┘

┌─ Agar Client 2 ko "Gap Up Momentum" assigned hota ───────┐
│  Assigned Strategy: "Gap Up Momentum"                      │
│  Segment: Nifty 50 → Conditions apply → Sort → RELIANCE ✅│
│  preselectedStockByStrategy["strat-2-id"] = RELIANCE       │
│  WebSocket: subscribe RELIANCE                             │
└─────────────────────────────────────────────────────────────┘
```

✅ **Process sirf ek baar chalta hai** — baar baar pre-select nahi hoga.
✅ **Jo client jis strategy se assigned hai, usi ke config+conditions use hote hain.**
✅ **Jo stocks select hue, unke WebSocket subscribe ho jate hain** — live ticks aate rehte hain.
✅ **Entry time (09:20:30) pe latest data WebSocket se milta hai.**

### Example 1 — "Pre-Open Momentum Breakout" (conditions: empty)

Har stock eligible → sirf segment filter + sorting se select hota hai.

| Step | Action | Result |
|------|--------|--------|
| 1 | Get preOpenCache (2000 stocks) | ✅ |
| 2 | Segment filter NSE F&O (isFo=true) | ~180 stocks |
| 3 | Conditions [] empty → **sab pass** | 180 stocks |
| 4 | Sort by changePercent ASC (Long = weakest first) | CANBK -1.20% = #1 |
| 5 | Store in preselectedStockByStrategy[strategyId] | CANBK |
| 6 | WebSocket subscribe CANBK | ✅ |

Top stocks by weakness:
```
CANBK      ₹485    -1.20%  ← #1 SELECTED
IDEA       ₹12.50  -0.90%
PNB        ₹135    -0.70%
INDUSINDBK ₹1,450  -0.50%
```

### Example 2 — Strategy with conditions (e.g., Gap Up + Volume)

Maano kisi strategy me conditions hain:
```json
"conditions": [
  { "indicator": "Gap Up", "operator": ">", "value": 0.5 },
  { "indicator": "Volume", "operator": ">", "value": 100000 }
]
```

Tab flow aisa hoga:

| Step | Action | Result |
|------|--------|--------|
| 1 | Get preOpenCache (2000 stocks) | ✅ |
| 2 | Segment filter (e.g., Nifty 50) | ~50 stocks |
| 3 | Apply conditions: Gap Up > 0.5% **AND** Volume > 1,00,000 | Sirf wahi stocks jo dono condition pass karein |
| 4 | Sort by changePercent ASC/DESC (according to action) | Top pick |
| 5 | Store in preselectedStockByStrategy[strategyId] | Selected stock ✅ |
| 6 | WebSocket subscribe | ✅ |

Example — Nifty 50 stocks with conditions:
```
RELIANCE   ₹2,850  Gap: +0.8%  Vol: 5,20,000  → PASS ✅
TCS        ₹3,920  Gap: +0.3%  Vol: 1,80,000  → FAIL (Gap < 0.5%)
HDFCBANK   ₹1,680  Gap: +1.2%  Vol: 8,50,000  → PASS ✅ → #1 SELECTED
ICICIBANK  ₹1,230  Gap: -0.2%  Vol: 3,00,000  → FAIL (Gap Down, not Up)
INFY       ₹1,750  Gap: +0.6%  Vol: 90,000    → FAIL (Volume < 1L)
```

Har strategy apne **conditions array** ke hisaab se stocks filter karti hai, phir sorting hoti hai.

**09:15:30 — Strategy selection done ✅ (~50ms)**

### Margin Fetch (per client, 50 concurrent)

Vikash:
- KiteClient.getMargins(apiKey, accessToken)
- Response: equity.net = ₹4,80,000
- marginCache["client-id"] = ₹4,80,000 ✅

1 client, 50 concurrent → ~1 sec → **09:15:31 ✅**

---

## ⏰ 09:20:30 — Entry Execution

tradingScheduler checks every 10s → time >= "09:20:30" ✅
executePreOpenTrades("system-admin", strategy.id)

Entry ka logic aise hai:

```
09:15 ───────────── 5min candle ──────────── 09:20 ── 09:20:30

Candle ban rahi hai:                     Candle complete ✅
  Open: ₹484                              Kite API se candle fetch
  High: ₹488  ← ye value use hogi         high = ₹488
  Low:  ₹482                              Buffer 0.1% → ₹488 × 1.001 = ₹488.49
  Close: ₹487                             SL-Market trigger = ₹488.49
```

09:15 se 09:20 tak jo **5min candle** bani, uske **high** price ko strategy se `candlePriceType: "high"` pada hai. Phir usme `bufferPercent: 0.1%` add karke breakout/trigger price banega. Ye price SL-Market order ke trigger ke roop me use hoga.

### Flow — Pehle common trigger price, phir har client ki quantity

```
 ╔═══════════════════════════════════════════════════════╗
 ║  1️⃣ COMMON (sab clients ke liye same)               ║
 ║     Candle high (09:15-09:20) → + buffer → trigger   ║
 ║     price = ₹488.49 ✅                                ║
 ╠═══════════════════════════════════════════════════════╣
 ║  2️⃣ PER CLIENT (capital/margin ke hisaab se)        ║
 ║     Vikash: ₹5,00,000 → 3% risk → qty = 2,944      ║
 ║     Raj:    ₹3,20,000 → 3% risk → qty = 1,885      ║
 ║     Priya:  ₹6,00,000 → 3% risk → qty = 3,533      ║
 ╠═══════════════════════════════════════════════════════╣
 ║  3️⃣ TRADE (har client same price pe individual qty) ║
 ║     Vikash: BUY 2944 CANBK SL-M @ ₹488.49          ║
 ║     Raj:    BUY 1885 CANBK SL-M @ ₹488.49          ║
 ║     Priya:  BUY 3533 CANBK SL-M @ ₹488.49          ║
 ╚═══════════════════════════════════════════════════════╝
```

### Steps in detail

| # | Step | Type | Detail |
|---|------|------|--------|
| 1 | Get preselected stock | **COMMON** | preselectedStockByStrategy → CANBK ✅ |
| 2 | Check existing trade today | **PER CLIENT** | prisma.trade.findFirst → none → Fresh ✅ |
| 3 | Fetch 09:15-09:20 5min candle high | **COMMON (1 API call, cached)** | Kite API historical → high = ₹488. candlePriceCache me store → baaki clients cache se le lenge |
| 4 | Trigger price | **COMMON** | ₹488 × (1 + 0.1/100) = ₹488.49 ✅ |
| 5 | Margin | **PER CLIENT (cached)** | marginCache se → ₹4,80,000 — 0 API call |
| 6 | Quantity: riskPercent (3%) | **PER CLIENT** | capitalAtRisk = margin × 3% |
| 7 | Quantity: capitalAlloc limit | **PER CLIENT** | Agar -1 nahi hai to allocLimit bhi check |
| 8 | Quantity: DB capital limit | **PER CLIENT** | DB capital se bada nahi hona chahiye |
| 9 | Quantity: SL points | **COMMON** | ₹488.49 × (1 - 1%) = ₹483.60, SL points = ₹4.89 |
| 10 | Final quantity | **PER CLIENT** | min(capitalAtRisk/SL_points, allocLimit/price) |
| 11 | Place SL-Market order | **PER CLIENT** | Har client apni qty ke saath trade karega |

### Vikash (RZJ500) — Example calculation

```
margin           = ₹4,80,000
riskPercent      = 3%
capitalAtRisk    = ₹4,80,000 × 3% = ₹14,400

SL Price         = ₹488.49 × (1 - 1/100) = ₹483.60
SL Points        = ₹488.49 - ₹483.60 = ₹4.89

Qty              = ₹14,400 / ₹4.89 = 2,944
```

### Quantity Calculation
```
margin           = ₹4,80,000
capitalAllocation = -1 (disabled) → no alloc limit
riskPercent       = 3%
capitalAtRisk     = ₹4,80,000 × 3% = ₹14,400

SL Price   = ₹488.49 × (1 - 1/100) = ₹483.60
SL Points  = ₹488.49 - ₹483.60 = ₹4.89

Qty        = ₹14,400 / ₹4.89 = 2,944
```

### Order Details
```
exchange:    NSE
symbol:     CANBK
type:       BUY
quantity:   2944
order_type: SL-MARKET
trigger:    ₹488.49
product:    MIS
validity:   DAY
```

**09:20:31 — Order placed ✅ (~1 sec for 1 client)**

---

## ⏰ 09:20:33 — Order Polling (background, every 10s)

startActiveTradesMonitoringScheduler() → every 10s

```
09:20:33 → Kite.orderHistory → status: "TRIGGER PENDING" ❌ (abhi fill nahi hui)
09:20:43 → status: "TRIGGER PENDING" ❌
09:20:53 → status: "COMPLETE" @ ₹488.50, qty 2944 ✅ (fill ho gayi)
```

### Jaise hi entry fill hui → Trade + SL + Target ek saath

```
╔════════════════════════════════════════════════════════╗
║  09:20:53 — Entry ORDER FILLED ✅                     ║
║                                                       ║
║  ┌─ TRADE DB CREATE ───────────────────────────────┐  ║
║  │  symbol: CANBK, entry: ₹488.50, qty: 2944      │  ║
║  │  status: OPEN                                   │  ║
║  └──────────────────────────────────────────────────┘  ║
║                                                       ║
║  ┌─ SL ORDER ───────────────────────────────────────┐  ║
║  │  SELL 2944 CANBK SL-MARKET @ ₹483.60 ✅          │  ║
║  │  order_id: 25062300012346                        │  ║
║  └──────────────────────────────────────────────────┘  ║
║                                                       ║
║  ┌─ TARGET ORDER ────────────────────────────────────┐ ║
║  │  SELL 2944 CANBK LIMIT @ ₹498.27 ✅               │ ║
║  │  order_id: 25062300012347                         │ ║
║  └──────────────────────────────────────────────────┘  ║
║                                                       ║
║  09:20:55 — Trade OPEN + SL/Target placed ✅         ║
╚════════════════════════════════════════════════════════╝
```

### Important — Entry fill nahi hui to SL/Target nahi lagega

```
╔════════════════════════════════════════════════════════╗
║  CASE 1: Entry fill hui → SL + Target place hoga ✅  ║
║                                                       ║
║  CASE 2: Entry TRIGGER PENDING raha                   ║
║          → SL/Target place nahi hoga                  ║
║          → Monitoring cycle me check hota rahega      ║
║                                                       ║
║  CASE 3: Entry REJECTED / CANCELLED                   ║
║          → Trade FAILED mark                           ║
║          → SL/Target kabhi place nahi hoga ❌         ║
║                                                       ║
║  CASE 4: Entry market close tak TRIGGER PENDING       ║
║          → Trade FAILED at 15:24 (square off)         ║
║          → SL/Target nahi laga ❌                     ║
╚════════════════════════════════════════════════════════╝
```

---

## ⏰ 09:20 to 15:24 — Monitor (every 10s)

| Time | CANBK Price | Action |
|------|-------------|--------|
| 09:30 | ₹492 | SL trail? trailingSL=-1 disabled → no trail |
| 10:00 | ₹495 | No action |
| 10:30 | ₹502 | **TARGET HIT 🎯** |
| | | Target SELL filled @ ₹502 |
| | | SL cancelled |
| | | Trade status: CLOSED |

### Vikash Final PnL
```
Entry:  ₹488.50 (2944 shares)
Exit:   ₹502.00 (2944 shares)
PnL:    2944 × ₹13.50 = ₹39,744 PROFIT ✅
ROI:    39,744 / 14,400 (risk) = 276% 🎯
```

**15:24:00** — Exit time → any open trades SQUARE OFF

---

## Timeline Summary

| Step | Time | Duration | Total |
|------|------|----------|-------|
| Token Refresh (1 client) | 08:00 | ~2 sec | 08:00:02 |
| Pre-Open Fetch | 09:08 | ~5 sec | 09:08:05 |
| Stock Selection | 09:15:30 | ~50ms | 09:15:30 |
| Margin Cache (1 client) | 09:15:30 | ~1 sec | 09:15:31 |
| ENTRY PLACE | 09:20:30 | ~1 sec | 09:20:31 |
| Order Fill | 09:20:33 | ~20-30s | 09:20:55 |
| Monitor / SL-Target | 09:20 | every 10s | 15:24:00 (square) |

### Key Points
- Stock selection happens **ONCE per strategy**, not per client
- All clients of same strategy trade **same stock** with individual quantity
- capitalAllocation = -1 means **only riskPerTrade (3%)** limits the quantity
- Database currently has **only 1 active client** (Vikash)
- ~500ms per client for entry (cached candle + cached margin + order API)
