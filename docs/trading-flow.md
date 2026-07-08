# Trading Flow — Complete System Document

> **Purpose:** Har condition, har scenario, har logic — code ke bina, real numbers ke saath.
> **Data Source:** Neon DB (production), Kite Live API, real client "Vikash Sharma"

---

## 1. System Overview

### Components
| Component | Role | Real Data Example |
|-----------|------|-------------------|
| **Neon DB (PostgreSQL)** | Stores strategies, clients, trades, configs | `client.capital = ₹5,00,000` |
| **Kite API (Zerodha)** | Real-time market data, order placement | `equity.net = ₹11,791.70` |
| **Scheduler (Cron)** | 60-sec loop, checks entry times, monitors positions | Runs 09:15–15:30 IST |
| **Algo Engine** | Calculates entry/SL/target/prices, places orders | Per-leg direction-aware |
| **OCO Monitor** | Part of scheduler, cancels losing leg's ALL orders | Runs every cycle |

### Data Flow
```
Neon DB Config → Scheduler → Algo Engine → Kite API (place orders)
                                          → Kite response → save to Neon DB trades[]
                    ↑                                    ↓
                    └── OCO Monitor ← checks every cycle ─┘
```

---

## 2. Strategy Config — DB Structure

### Full Strategy Config (from DB `Strategy.configJson`)
```json
{
  "basicInfo": {
    "name": "Pre-Open Momentum Breakout",
    "status": "active",
    "segment": "NSE F&O",
    "exchange": "NSE",
    "preSelectTime": "09:15:30",
    "selectPosition": 1,
    "tradeType": "Intraday",
    "checkIntervalSec": 60,
    "description": "Pre-Open Momentum Breakout Strategy",
    "exitTime": "15:15:00"
  },
  "stoploss": {
    "type": "Fixed %",
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
  "riskManagement": {
    "riskPerTrade": 1,
    "killSwitch": false,
    "maxOpenPositions": 3,
    "maxDailyLoss": -1,
    "maxDailyProfit": -1,
    "capitalAllocation": -1,
    "misMarginRate": -1
  },
  "conditions": [
    {
      "value": "-10",
      "logical": "AND",
      "operator": ">",
      "indicator": "Pre Open Change %"
    }
  ],
  "legs": [
    {
      "name": "Leg 1",
      "enabled": true,
      "entryTime": "09:20:30",
      "timeframe": "5m",
      "tradeAction": {
        "action": "Long",
        "orderType": "SL-Market",
        "bufferPercent": 0.1,
        "candlePriceType": "high"
      }
    },
    {
      "name": "Leg 2",
      "enabled": true,
      "entryTime": "09:30:00",
      "timeframe": "15m",
      "tradeAction": {
        "action": "Short",
        "orderType": "SL-Market",
        "bufferPercent": 0.1,
        "candlePriceType": "low"
      }
    }
  ]
}
```

### Config Rules
| Key | Value | Rule |
|-----|-------|------|
| `riskPerTrade` | 1% | **COMMON** across all legs |
| `stoploss.fixedPercent` | 1% | **COMMON** %, but ₹ value **PER LEG** (entry alag → ₹ alag) |
| `stoploss.trailingSL` | -1 | **DISABLED** — no trailing SL |
| `target.type` | Trailing Target | Name only; `trailingTarget: -1` → actually disabled |
| `target.profitPercent` | 2% | **COMMON** %, but ₹ value **PER LEG** |
| `target.trailingTarget` | -1 | **DISABLED** — no trailing target |
| `maxOpenPositions` | 3 | Max 3 simultaneous trades per client |
| `misMarginRate` | -1 | **DISABLED** — no MIS margin cap on quantity |
| `conditions` | `Pre Open Change % > -10` | Sirf 1 condition — stocks below -10% skip |
| `legs[].entryTime` | Per leg | Leg 1: 09:20:30, Leg 2: 09:30:00 |
| `legs[].tradeAction.action` | Per leg | Leg 1: Long/BUY, Leg 2: Short/SELL |
| `legs[].tradeAction.candlePriceType` | Per leg | Leg 1: high, Leg 2: low |

---

## 3. Client & Wallet — Real Numbers

### Client Data (from DB)
| Field | Value | Source |
|-------|-------|--------|
| Client Name | Vikash Sharma | `Client.user.name` |
| Client ID | `b364d72f-e2e2-4dbc-bbef-3286c75e1875` | DB |
| Capital (DB) | ₹5,00,000 | `Client.capital` |
| Strategy | Pre-Open Momentum Breakout | `Client.strategyId` |
| Strategy ID | `c7bafa89-3403-44c3-bcd0-199602c878e1` | DB |

### Wallet Data (from Kite API)
| Field | Value | Source |
|-------|-------|--------|
| Zerodha equity.net | ₹11,791.70 | `Kite.getMargins().equity.net` (25 June 2026) |
| Zerodha equity.available | ₹11,791.70 | Live API |
| Zerodha equity.used | ₹0.00 | Live API |

### Capital Calculation (Step by Step)
```
Inputs:
  marginOrApi = wallet (equity.net) = ₹11,791.70
  dbCapital  = DB capital         = ₹5,00,000
  dbDisabled = (dbCapital === -1) = false

Decision:
  dbDisabled? → No → use Math.min(wallet, DB)
  clientCapital = Math.min(11,791.70, 5,00,000)
               = ₹11,791.70
```
**Result:** System uses wallet value (₹11,791.70) because it's lower than DB capital.

---

## 4. Pre-Market Phase (08:00 — 09:15:30)

### What Happens
| Time | Action | Detail |
|------|--------|--------|
| 08:00 | Token refresh | Kite access token refreshed for all clients |
| 08:00 — 09:15:30 | Wait for pre-open | Scheduler idle until `preSelectTime` |
| 09:15:30 | Pre-open fetch | NSE F&O pre-open data fetched via Kite API |

### Condition Check
```
Condition #1: Pre Open Change % > -10
  → Stocks with change% <= -10 are FILTERED OUT (extreme losers skipped)
  → Only stocks with change% > -10 pass
```

### Stock Selection Logic
**Since Leg 1 = LONG:** Stocks sorted ascending by change% (most loser first).

| Leg 1 Direction | Sort Order | Picks |
|----------------|-----------|-------|
| **LONG** | Ascending (most negative first) | **Top LOSER** among remaining |
| **SHORT** | Descending (most positive first) | **Top GAINER** among remaining |

### Pre-Open Data (NSE F&O — Example)
Step-by-step selection:

```
Step 1: All pre-open stocks
  COAL INDIA:   change% = -12.0%, volume = 8,00,000
  JSW STEEL:    change% = -8.0%,  volume = 9,50,000
  HINDALCO:     change% = -4.8%,  volume = 8,20,000
  CANBK:        change% = +3.2%,  volume = 5,20,000

Step 2: Apply condition — Pre Open Change % > -10
  COAL INDIA:   -12.0 > -10? → NO  → SKIP (filtered out)
  JSW STEEL:    -8.0  > -10? → YES → PASS
  HINDALCO:     -4.8  > -10? → YES → PASS
  CANBK:        +3.2  > -10? → YES → PASS

Step 3: Sort ascending (LONG direction = most loser first)
  JSW STEEL:    -8.0%  → Rank #1 (biggest loser above -10%)
  HINDALCO:     -4.8%  → Rank #2
  CANBK:        +3.2%  → Rank #3

Step 4: selectPosition = 1 → JSW STEEL selected (change% = -8.0%)
```

---

## 5. Leg 1 Execution — LONG (09:20:30)

### Before Entry — Scheduler Check
```
Current IST Time: 09:20:30

Scheduler Logic:
  Has Leg 1 already been executed today?
    → Check lastEntryByStrategy map for key "leg_0_<strategyId>"
    → Not found → First execution today → Proceed

  Generate dualLegGroupId (UUID): "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  This ID is shared with Leg 2 later.
```

### Step 1: Fetch Candle Data
```
Symbol: JSW STEEL
Timeframe: 5m (from config.legs[0].timeframe)
Candle Window: preSelectTime(09:15:30) → entryTime(09:20:30)
Candle Price Type: "high" (from config.legs[0].tradeAction.candlePriceType)

Kite API Response (historical data):
  5-min candle (09:15:30 — 09:20:30):
    Open: ₹895.00
    High: ₹897.50  ← THIS IS THE CANDLE PRICE WE USE
    Low:  ₹893.00
    Close: ₹896.00

candlePrice = ₹897.50 (the HIGH of the 5-min candle)
```

### Step 2: Apply Buffer
```
Direction: LONG
Buffer %: 0.1% (from config.legs[0].tradeAction.bufferPercent)

Formula (LONG): candlePrice × (1 + bufferPercent / 100)
             = 897.50 × (1 + 0.1/100)
             = 897.50 × 1.001
             = 898.398

Tick Rounding (JSW STEEL tick size = ₹0.05):
  Round to nearest 0.05: Math.round(898.398 / 0.05) × 0.05
                       = Math.round(17967.96) × 0.05
                       = 17968 × 0.05
                       = 898.40

breakoutEntryPrice = ₹898.40
```

### Step 3: Breakout Check
```
Order Type: SL-Market (from config.legs[0].tradeAction.orderType)
Price Action Condition: false (no Price Action condition in config)

3-Tier Logic:
  Tier 1: Is it SL-Market? → YES → Auto PASS (skip price check)

System does NOT check LTP vs entry for SL-Market orders.
```

### Step 4: Circuit Limit Check & Entry Price Adjustment

**Key Concept:** Entry price ko circuit limits ke andar laane ke liye adjust kiya jaata hai. Agar breakout price circuit ke bahar hai to usse cap/raise kiya jaata hai.

```
Step 4a: Fetch fresh circuit limits from Kite Quote API
  Symbol: JSW STEEL (NSE)
  Kite API Response:
    upper_circuit_limit: ₹920.00
    lower_circuit_limit: ₹870.00

Step 4b: Compare entry price with circuit limits
  Direction: LONG (BUY)
  breakoutEntryPrice (pre-circuit): ₹898.40

  Check:
    Is ₹898.40 > upperCircuit (₹920.00)? → NO
    Is ₹898.40 < lowerCircuit (₹870.00)? → NO
    → No adjustment needed. adjustedEntryPrice = ₹898.40

  ┌─────────────────────────────────────────────────────────────────────┐
  │ CASE A (LONG): entryPrice > upperCircuit                            │
  │   adjustedEntryPrice = upperCircuit (CAP)                           │
  │   Example: ₹930.00 → capped to ₹920.00                              │
  ├─────────────────────────────────────────────────────────────────────┤
  │ CASE B (LONG): entryPrice < lowerCircuit                            │
  │   adjustedEntryPrice = lowerCircuit (RAISE)                         │
  │   Example: ₹860.00 → raised to ₹870.00                              │
  ├─────────────────────────────────────────────────────────────────────┤
  │ CASE C (SHORT): entryPrice < lowerCircuit                           │
  │   adjustedEntryPrice = lowerCircuit (RAISE)                         │
  │   Example: ₹860.00 → raised to ₹870.00                              │
  ├─────────────────────────────────────────────────────────────────────┤
  │ CASE D (SHORT): entryPrice > upperCircuit                           │
  │   adjustedEntryPrice = upperCircuit (CAP)                           │
  │   Example: ₹930.00 → capped to ₹920.00                              │
  └─────────────────────────────────────────────────────────────────────┘

Step 4c: Round to tick size
  adjustedEntryPrice = ₹898.40 (no change needed in this example)
```

**Result:** `adjustedEntryPrice = ₹898.40` (iss case mein same raha kyunki ₹898.40 circuit ke andar hai)

**NEXT:** Ab SL, Target aur Quantity sab `adjustedEntryPrice` se calculate hote hain.
Original `entryPrice` (₹898.40) ko `rawEntryPrice` ke tor pe display ke liye save kiya jaata hai.

---

### Step 5: Calculate SL Points
```
SL Type: Fixed % (from config.stoploss.type)
SL Percent: 1% (from config.stoploss.fixedPercent) — COMMON value

Formula: slPoints = entryPrice × (slPercent / 100)
                 = 898.40 × (1 / 100)
                 = 898.40 × 0.01
                 = 8.984

Result: slPoints = ₹8.984 (Leg 1 specific, based on its entry price)
```

### Step 6: Calculate Quantity
```
Capital At Risk (COMMON — same for all legs):
  riskPercent = 1 (from config.riskManagement.riskPerTrade)
  capitalAtRisk = clientCapital × (riskPercent / 100)
               = 11,791.70 × (1 / 100)
               = ₹117.917

Formula (PER LEG — depends on leg's slPoints):
  quantity = Math.floor(capitalAtRisk / slPoints)
           = Math.floor(117.917 / 8.984)
           = Math.floor(13.124)
           = 13 shares

MIS Margin Check:
  misMarginRate = -1 → DISABLED
  No cap on quantity from MIS margin.

  finalQuantity = 13 shares
```

### Step 7: Calculate Stop Loss Price
```
Direction: LONG
Formula: stopLoss = adjustedEntryPrice − slPoints
                  = 898.40 − 8.984
                  = 889.416

Tick Rounding (₹0.05):
  finalStopLoss = Math.round(889.416 / 0.05) × 0.05
                = Math.round(17788.32) × 0.05
                = 17788 × 0.05
                = 889.40

Result: SL at ₹889.40 (SELL order)
```

### Step 8: Calculate Target Price
```
Target Type: Trailing Target (from config.target.type)
  Note: Type name is "Trailing Target" but trailingTarget = -1 → DISABLED
  Falls back to profitPercent = 2%

Direction: LONG
Formula: target = adjustedEntryPrice × (1 + profitPercent / 100)
                = 898.40 × (1 + 2/100)
                = 898.40 × 1.02
                = 916.368

Tick Rounding (₹0.05):
  finalTarget = Math.round(916.368 / 0.05) × 0.05
              = Math.round(18327.36) × 0.05
              = 18327 × 0.05
              = 916.35

Result: Target at ₹916.35 (SELL order)
```

### Step 9: Place Orders on Kite
```
Client: Vikash Sharma
Symbol: JSW STEEL (NSE)
Product: MIS

Order 1 — Entry:
  Type: BUY
  Order Type: SL-Market
  Trigger: ₹898.40 (adjustedEntryPrice)
  Quantity: 13
  → Kite Response: { order_id: "kite_entry_l1_001", status: "pending" }

Order 2 — Stop Loss:
  Type: SELL
  Order Type: SL-Market
  Trigger: ₹889.40
  Quantity: 13
  → Kite Response: { order_id: "kite_sl_l1_001", status: "pending" }

Order 3 — Target:
  Type: SELL
  Order Type: LIMIT
  Price: ₹916.35
  Quantity: 13
  → Kite Response: { order_id: "kite_tgt_l1_001", status: "pending" }
```

### Step 10: Save Trade to DB
```
Trade Record:
  id: auto-generated UUID
  clientId: "b364d72f-..."
  strategyId: "c7bafa89-..."
  symbol: "JSWSTEEL"
  direction: "LONG"
  legName: "Leg 1"
  legTimeframe: "5m"
  dualLegGroupId: "a1b2c3d4-..." (shared with Leg 2)
  
  entryPrice: 898.40        (adjustedEntryPrice — circuit-adjusted)
  stopLoss: 889.40
  target: 916.35
  quantity: 13
  
  originalEntryPrice: 898.40 (rawEntryPrice — pre-circuit, same in this case)
  originalStopLoss: 889.416  (rawStopLoss — pre-circuit tick rounding)
  originalTarget: 916.368    (rawTarget — pre-circuit tick rounding)
  
  entryOrderId: "kite_entry_l1_001"
  entryOrderStatus: "pending"
  slOrderId: "kite_sl_l1_001"
  slOrderStatus: "pending"
  targetOrderId: "kite_tgt_l1_001"
  targetOrderStatus: "pending"
  
  status: "pending"
  entryTime: 2026-06-25T09:20:30.000Z
```

---

## 6. Leg 2 Execution — SHORT (09:30:00)

### Before Entry — Scheduler Check
```
Current IST Time: 09:30:00

Scheduler Logic:
  Has Leg 2 already been executed today?
    → Check lastEntryByStrategy map for key "leg_1_<strategyId>"
    → Not found → First execution today → Proceed

  Use same dualLegGroupId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

### Step 1: Fetch Candle Data
```
Symbol: JSW STEEL
Timeframe: 15m (from config.legs[1].timeframe)
Candle Window: preSelectTime(09:15:30) → entryTime(09:30:00)
Candle Price Type: "low" (from config.legs[1].tradeAction.candlePriceType)

Kite API Response (historical data):
  15-min candle (09:15:30 — 09:30:00):
    Open: ₹895.00
    High: ₹898.50
    Low:  ₹892.00  ← THIS IS THE CANDLE PRICE WE USE
    Close: ₹896.50

candlePrice = ₹892.00 (the LOW of the 15-min candle)
```

### Step 2: Apply Buffer
```
Direction: SHORT
Buffer %: 0.1% (from config.legs[1].tradeAction.bufferPercent)

Formula (SHORT): candlePrice × (1 − bufferPercent / 100)
              = 892.00 × (1 − 0.1/100)
              = 892.00 × 0.999
              = 891.108

Tick Rounding (₹0.05):
  breakoutEntryPrice = Math.round(891.108 / 0.05) × 0.05
                     = Math.round(17822.16) × 0.05
                     = 17822 × 0.05
                     = 891.10

breakoutEntryPrice = ₹891.10
```

### Step 3: Breakdown Check
```
Order Type: SL-Market → Auto PASS (skip price check)
```

### Step 4: Circuit Limit Check & Entry Price Adjustment

**Key Concept:** SHORT direction mein bhi entry price circuit limits ke andar laaya jaata hai.

```
Step 4a: Fetch fresh circuit limits from Kite Quote API
  Symbol: JSW STEEL (NSE)
  Kite API Response:
    upper_circuit_limit: ₹920.00
    lower_circuit_limit: ₹870.00

Step 4b: Compare entry price with circuit limits
  Direction: SHORT (SELL)
  breakoutEntryPrice (pre-circuit): ₹891.10

  Check:
    Is ₹891.10 < lowerCircuit (₹870.00)? → NO
    Is ₹891.10 > upperCircuit (₹920.00)? → NO
    → No adjustment needed. adjustedEntryPrice = ₹891.10

  For SHORT:
    CASE C: entryPrice < lowerCircuit → adjustedEntryPrice = lowerCircuit (RAISE)
    CASE D: entryPrice > upperCircuit → adjustedEntryPrice = upperCircuit (CAP)

Step 4c: Round to tick size
  adjustedEntryPrice = ₹891.10 (no change needed in this example)
```

**Result:** `adjustedEntryPrice = ₹891.10`

---

### Step 5: Calculate SL Points
```
SL Percent: 1% — COMMON value (same as Leg 1)

Formula: slPoints = entryPrice × (slPercent / 100)
                 = 891.10 × (1 / 100)
                 = 891.10 × 0.01
                 = 8.911

Result: slPoints = ₹8.911 (different from Leg 1's ₹8.984 because entry is different)
```

### Step 6: Calculate Quantity
```
Capital At Risk: ₹117.917 — COMMON (same as Leg 1)

Formula (PER LEG):
  quantity = Math.floor(capitalAtRisk / slPoints)
           = Math.floor(117.917 / 8.911)
           = Math.floor(13.233)
           = 13 shares

MIS Margin Check: DISABLED (misMarginRate = -1)
finalQuantity = 13 shares
```

### Step 7: Calculate Stop Loss Price
```
Direction: SHORT
Formula: stopLoss = adjustedEntryPrice + slPoints
                  = 891.10 + 8.911
                  = 900.011

Tick Rounding (₹0.05):
  finalStopLoss = Math.round(900.011 / 0.05) × 0.05
                = Math.round(18000.22) × 0.05
                = 18000 × 0.05
                = 900.00

Result: SL at ₹900.00 (BUY order — cover short)
```

### Step 8: Calculate Target Price
```
Direction: SHORT
Formula: target = adjustedEntryPrice × (1 − profitPercent / 100)
                = 891.10 × (1 − 2/100)
                = 891.10 × 0.98
                = 873.278

Tick Rounding (₹0.05):
  finalTarget = Math.round(873.278 / 0.05) × 0.05
              = Math.round(17465.56) × 0.05
              = 17466 × 0.05
              = 873.30

Result: Target at ₹873.30 (BUY order — cover short)
```

### Step 9: Place Orders on Kite
```
Order 1 — Entry:
  Type: SELL (short entry)
  Order Type: SL-Market
  Trigger: ₹891.10 (adjustedEntryPrice)
  Quantity: 13
  → Kite Response: { order_id: "kite_entry_l2_001", status: "pending" }

Order 2 — Stop Loss:
  Type: BUY (cover short)
  Order Type: SL-Market
  Trigger: ₹900.00
  Quantity: 13
  → Kite Response: { order_id: "kite_sl_l2_001", status: "pending" }

Order 3 — Target:
  Type: BUY (cover short)
  Order Type: LIMIT
  Price: ₹873.30
  Quantity: 13
  → Kite Response: { order_id: "kite_tgt_l2_001", status: "pending" }
```

### Step 10: Save Trade to DB
```
Trade Record:
  id: auto-generated UUID
  clientId: "b364d72f-..."
  strategyId: "c7bafa89-..."
  symbol: "JSWSTEEL"
  direction: "SHORT"
  legName: "Leg 2"
  legTimeframe: "15m"
  dualLegGroupId: "a1b2c3d4-..." (SAME as Leg 1)
  
  entryPrice: 891.10        (adjustedEntryPrice — circuit-adjusted)
  stopLoss: 900.00
  target: 873.30
  quantity: 13
  
  originalEntryPrice: 891.10 (rawEntryPrice — pre-circuit, same in this case)
  originalStopLoss: 900.011  (rawStopLoss — pre-circuit tick rounding)
  originalTarget: 873.278    (rawTarget — pre-circuit tick rounding)
  entryOrderId: "kite_entry_l2_001"
  entryOrderStatus: "pending"
  slOrderId: "kite_sl_l2_001"
  slOrderStatus: "pending"
  targetOrderId: "kite_tgt_l2_001"
  targetOrderStatus: "pending"
  
  status: "pending"
  entryTime: 2026-06-25T09:30:00.000Z
```

---

## 7. TRUE OCO — First Fill Wins

### OCO Execution Flow
```
Step 1: Dono legs ke entry orders Kite pe pending hain
        Leg 1 (LONG)  → entry trigger @ ₹898.40 (SL-Market)
        Leg 2 (SHORT) → entry trigger @ ₹891.10 (SL-Market)

Step 2: Market move hota hai — koi ek trigger hit hota hai
        ┌─────────────────────────────────────────────────────┐
        │ CASE A: Leg 1 fills FIRST (LONG wins)               │
        │   → Leg 1 entry BUY fill @ ₹899                     │
        │   → OCO triggers:                                   │
        │       • Leg 2 ke TINON orders CANCEL karo:          │
        │         - entry order cancel                         │
        │         - SL order cancel                            │
        │         - target order cancel                        │
        │       • Leg 2 status → "cancelled"                   │
        │   → Circuit Limit Check (LONG):                      │
        │       • Fresh circuit limits fetch karo              │
        │       • Agar SL < lowerCircuit → SL = lower+0.05    │
        │       • Agar Target > upperCircuit → Target = upper  │
        │       • Dubara tick size round                      │
        │   → Leg 1 ke SL + Target PLACE karo:                 │
        │       • SL-Market SELL @ ₹889.40                     │
        │       • LIMIT SELL @ ₹916.35 (target)                │
        │   → Tab tak monitor until SL/Target hit or exit:    │
        │       - SL hit → exit, PnL calculate                 │
        │       - Target hit → exit, PnL calculate             │
        │       - Market close → force exit                    │
        └─────────────────────────────────────────────────────┘
        ┌─────────────────────────────────────────────────────┐
        │ CASE B: Leg 2 fills FIRST (SHORT wins)              │
        │   → Leg 2 entry SELL fill @ ₹890                    │
        │   → OCO triggers:                                   │
        │       • Leg 1 ke TINON orders CANCEL karo:          │
        │         - entry order cancel                         │
        │         - SL order cancel                            │
        │         - target order cancel                        │
        │       • Leg 1 status → "cancelled"                   │
        │   → Circuit Limit Check (SHORT):                     │
        │       • Fresh circuit limits fetch karo              │
        │       • Agar SL > upperCircuit → SL = upper-0.05    │
        │       • Agar Target < lowerCircuit → Target = lower  │
        │       • Dubara tick size round                      │
        │   → Leg 2 ke SL + Target PLACE karo:                 │
        │       • SL-Market BUY @ ₹900.00                      │
        │       • LIMIT BUY @ ₹873.30 (target)                 │
        │   → Tab tak monitor until SL/Target hit or exit:    │
        │       - SL hit → exit, PnL calculate                 │
        │       - Target hit → exit, PnL calculate             │
        │       - Market close → force exit                    │
        └─────────────────────────────────────────────────────┘
```

### How OCO Works
```
Both Legs have orders pending on Kite:
  Leg 1 (LONG):  Entry @ ₹898.40 | SL @ ₹889.40 | Target @ ₹916.35
  Leg 2 (SHORT): Entry @ ₹891.10 | SL @ ₹900.00 | Target @ ₹873.30

OCO = One Cancels Other
Whichever entry fills FIRST on Kite → the OTHER leg's ALL orders get cancelled.
```

### Scenario A: Leg 1 Fills First (LONG wins)

**Market Moves UP:**
```
Time: 09:32:00
JSW STEEL Price: ₹899.00 (above Leg 1 trigger of ₹898.40)
→ Kite fills Leg 1 BUY entry order
→ Leg 1 entryOrderStatus = "filled"
→ Leg 1 trade status = "open" (now active)

OCO Monitor detects:
  Leg 1 entry = filled
  Leg 2 entry = still pending (not yet filled)

Action:
   1. Call Kite API → CANCEL Leg 2 entry order (kite_entry_l2_001)
   2. Call Kite API → CANCEL Leg 2 SL order (kite_sl_l2_001)
   3. Call Kite API → CANCEL Leg 2 target order (kite_tgt_l2_001)
   4. Update DB:
     Leg 2: status = "cancelled"
            entryOrderStatus = "cancelled"
            slOrderStatus = "cancelled"
            targetOrderStatus = "cancelled"
            exitReason = "OCO_CANCELLED — Leg 1 filled first"

   5. Circuit Limit Check (LONG) — right before placing SL/Target:
      Fresh circuit limits fetch karo using Kite Quote API
      
      Check Leg 1 SL (₹889.40) vs lowerCircuit (₹870.00):
        Is 889.40 < 870.00? → NO → SL unchanged at ₹889.40
        IF YES (SL below lowerCircuit): SL = lowerCircuit + 0.05
      
      Check Leg 1 Target (₹916.35) vs upperCircuit (₹920.00):
        Is 916.35 > 920.00? → NO → Target unchanged at ₹916.35
        IF YES (Target above upperCircuit): Target = upperCircuit
      
      Round both to tick size again

   6. Place Leg 1 SL + Target orders on Kite:
      → SL-Market SELL trigger @ ₹889.40
      → LIMIT SELL @ ₹916.35

DB After OCO — Scenario A:
  Leg 1 (LONG):  entryOrderStatus = "filled", status = "open"  ← ACTIVE
  Leg 2 (SHORT): ALL cancelled                                 ← LOSER
```

### Scenario B: Leg 2 Fills First (SHORT wins)

**Market Moves DOWN:**
```
Time: 09:35:00
JSW STEEL Price: ₹890.50 (below Leg 2 trigger of ₹891.10)
→ Kite fills Leg 2 SELL entry order
→ Leg 2 entryOrderStatus = "filled"
→ Leg 2 trade status = "open" (now active)

OCO Monitor detects:
  Leg 2 entry = filled
  Leg 1 entry = still pending

Action:
   1. Call Kite API → CANCEL Leg 1 entry order (kite_entry_l1_001)
   2. Call Kite API → CANCEL Leg 1 SL order (kite_sl_l1_001)
   3. Call Kite API → CANCEL Leg 1 target order (kite_tgt_l1_001)
   4. Update DB:
     Leg 1: ALL cancelled

   5. Circuit Limit Check (SHORT) — right before placing SL/Target:
      Fresh circuit limits fetch karo using Kite Quote API
      
      Check Leg 2 SL (₹900.00) vs upperCircuit (₹920.00):
        Is 900.00 > 920.00? → NO → SL unchanged at ₹900.00
        IF YES (SL above upperCircuit): SL = upperCircuit - 0.05
      
      Check Leg 2 Target (₹873.30) vs lowerCircuit (₹870.00):
        Is 873.30 < 870.00? → NO → Target unchanged at ₹873.30
        IF YES (Target below lowerCircuit): Target = lowerCircuit
      
      Round both to tick size again

   6. Place Leg 2 SL + Target orders on Kite:
      → SL-Market BUY trigger @ ₹900.00
      → LIMIT BUY @ ₹873.30

DB After OCO — Scenario B:
  Leg 1 (LONG):  ALL cancelled                                 ← LOSER
  Leg 2 (SHORT): entryOrderStatus = "filled", status = "open"  ← ACTIVE
```

### Scenario C: Both Still Pending

**Market hasn't hit either trigger:**
```
Time: 09:45:00
JSW STEEL Price: ₹895.00 (between both triggers)
→ Neither Leg 1 trigger (₹898.40) nor Leg 2 trigger (₹891.10) reached
→ Both legs still "pending"

OCO Monitor: No action — keep waiting
Scheduler: Keeps checking every 60 seconds
```

### Scenario D: Both Fill (Rare — Race Condition)
```
Theoretically possible if Kite fills both simultaneously.
In practice, Kite processes orders sequentially.

If both fill:
  OCO Monitor detects:
    → Both legs have entryOrderStatus = "filled"
    → Both legs are "open"

  Action (edge case handling):
    → Cancel both legs' SL & Target orders
    → Place market exit orders for BOTH legs
    → Mark both as "closed" with exitReason = "OCO_RACE_CONDITION"
```

---

## 8. Position Monitoring (After Entry Fills)

### 8A: Trailing Stop Loss

**DISABLED** — `trailingSL = -1`

SL stays fixed at initial level throughout the trade. No movement.

### 8B: Trailing Target

**DISABLED** — `trailingTarget = -1`

Target stays fixed at initial level throughout the trade. No movement.

### 8C: Fallback Candle Checks

System checks every 60 seconds. Uses candle close price for fallback:

**For LONG (Leg 1):**
```
SL Hit:  current candle close <= stopLossLevel (₹889.40)
Target Hit: current candle close >= targetLevel (₹916.35)

Example — SL hit via fallback:
  15-min candle close = ₹889.00 (14:30)
  889.00 < 889.40 → SL HIT
  → Place MARKET SELL to exit
  → PnL = (889.00 − 898.40) × 13 = −₹122.20
```

**For SHORT (Leg 2):**
```
SL Hit:  current candle close >= stopLossLevel (₹900.00)
Target Hit: current candle close <= targetLevel (₹873.30)

Example — Target hit via fallback:
  15-min candle close = ₹873.00 (14:45)
  873.00 < 873.30 → TARGET HIT
  → Place MARKET BUY to cover
  → PnL = (891.10 − 873.00) × 13 = +₹235.30
```

### 8D: Kite Order Status Checks

Every cycle, scheduler checks each order's status on Kite:

| Kite Status | System Action |
|-------------|---------------|
| `COMPLETE` | Mark as "filled" in DB |
| `CANCELLED` | Mark as "cancelled" in DB, log reason |
| `REJECTED` | Mark as "failed" in DB, save kiteResponse.message |
| `PENDING` | Keep waiting |
| `OPEN` | Keep waiting |
| `TRIGGER PENDING` | Keep waiting |

### 8E: Circuit Breakers

**Max Daily Loss (disabled):**
```
maxDailyLoss = -1 → DISABLED
No loss limit in place.
```

**Max Daily Profit (disabled):**
```
maxDailyProfit = -1 → DISABLED
No profit limit in place.
```

**Max Open Positions:**
```
maxOpenPositions = 3
Client can have up to 3 simultaneous open trades.
```

**Circuit Limit Adjustments (Kite Live Quotes):**
```
System fetches fresh upper/lower circuit limits from Kite Quote API at two points:

Point 1: Before entry (Step 4 of Leg Execution)
  → Entry price ko circuit ke andar laaya jaata hai (cap/raise)
  → Adjusted entry price se SL, Target, Quantity calculate hote hain

Point 2: After entry fill (OCO Monitor)
  → Entry fill hone ke baad, SL+Target place karne se PEHLE
  → Agar SL circuit ke bahar → adjust: LONG: lower+0.05, SHORT: upper-0.05
  → Agar Target circuit ke bahar → adjust: LONG: upper, SHORT: lower

DB Fields:
  originalEntryPrice: pre-circuit entry price
  originalStopLoss: pre-circuit SL (before post-fill adjustment)
  originalTarget: pre-circuit target (before post-fill adjustment)
```

---

## 9. Square Off (15:15 — 15:24)

### Force Exit Logic
```
exitTime = 15:15:00 (from config.basicInfo.exitTime)
forceExitDeadline = 15:24 (9-minute grace period)

Scheduler checks every 60 seconds after 15:15:
  Is there an open trade?
  → Yes → Check if past forceExitTime (15:24)
  → Not yet → Continue monitoring
  → Past 15:24 → Force exit
```

### Force Exit — LONG (Leg 1)
```
Step 1: Cancel remaining SL + Target orders on Kite
  → CANCEL slOrderId (kite_sl_l1_001)
  → CANCEL targetOrderId (kite_tgt_l1_001)

Step 2: Place MARKET SELL at current price
  Current LTP = ₹894.00
  → SELL 13 JSWSTEEL @ MARKET

Step 3: On Kite COMPLETE response:
  exitPrice = ₹894.00
  exitTime = 2026-06-25T15:24:30.000Z
  PnL = (894.00 − 898.40) × 13 = −₹57.20
  status = "closed"
  exitReason = "FORCE_EXIT"
```

### Force Exit — SHORT (Leg 2)
```
Step 1: Cancel remaining SL + Target orders on Kite
  → CANCEL slOrderId (kite_sl_l2_001)
  → CANCEL targetOrderId (kite_tgt_l2_001)

Step 2: Place MARKET BUY to cover
  Current LTP = ₹894.00
  → BUY 13 JSWSTEEL @ MARKET

Step 3: On Kite COMPLETE response:
  exitPrice = ₹894.00
  exitTime = 2026-06-25T15:24:30.000Z
  PnL = (891.10 − 894.00) × 13 = −₹37.70
  status = "closed"
  exitReason = "FORCE_EXIT"
```

---

## 10. Complete Scenario Walkthrough — Leg 1 Wins

### Timeline
| Time | Event | Price | Action |
|------|-------|-------|--------|
| 09:15:30 | Pre-open data fetch | — | JSW STEEL selected (-8.0%) |
| 09:20:30 | Leg 1 entry time | 5-min High = ₹897.50 | Place BUY SL-M @ ₹898.40 |
| 09:30:00 | Leg 2 entry time | 15-min Low = ₹892.00 | Place SELL SL-M @ ₹891.10 |
| 09:32:00 | Leg 1 fills! | ₹899 | Entry filled → Leg 2 CANCELLED |
| 09:32:01 | OCO triggers | — | Cancel ALL Leg 2 orders on Kite |
| 11:00:00 | Monitoring | ₹905 | Price up ₹6.60 from entry |
| 13:00:00 | Monitoring | ₹912 | Price up ₹13.60 |
| 14:30:00 | Monitoring | ₹915 | Price up ₹16.60 |
| 14:45:00 | Target hit! | ₹917 | Target order fills → SELL @ ₹916.35 |
| 14:45:01 | Trade closed | ₹916.35 | PnL = (916.35 − 898.40) × 13 = **+₹233.35** |

### PnL Summary
```
Entry Price: ₹898.40
Exit Price: ₹916.35 (Target hit)
Quantity: 13
PnL = (916.35 − 898.40) × 13 = +₹233.35

Return on Capital:
  Capital Used = 898.40 × 13 = ₹11,679.20
  Gross Return % = (233.35 / 11,679.20) × 100 = +2.0%
```

---

## 11. Complete Scenario Walkthrough — Leg 2 Wins

### Timeline
| Time | Event | Price | Action |
|------|-------|-------|--------|
| 09:15:30 | Pre-open data fetch | — | JSW STEEL selected (-8.0%) |
| 09:20:30 | Leg 1 entry | 5-min High = ₹897.50 | Place BUY SL-M @ ₹898.40 |
| 09:30:00 | Leg 2 entry | 15-min Low = ₹892.00 | Place SELL SL-M @ ₹891.10 |
| 09:35:00 | Leg 2 fills! | ₹890 | Entry filled → Leg 1 CANCELLED |
| 11:00:00 | Monitoring | ₹885 | Price down ₹6.10 from entry |
| 13:00:00 | Monitoring | ₹880 | Price down ₹11.10 |
| 14:00:00 | Monitoring | ₹875 | Price down ₹16.10 |
| 14:30:00 | Target hit! | ₹873 | Target order fills → BUY @ ₹873.30 |
| 14:30:01 | Trade closed | ₹873.30 | PnL = (891.10 − 873.30) × 13 = **+₹231.40** |

### PnL Summary
```
Entry Price: ₹891.10
Exit Price: ₹873.30 (Target hit)
Quantity: 13
PnL = (891.10 − 873.30) × 13 = +₹231.40

Return on Capital:
  Capital Used = 891.10 × 13 = ₹11,584.30
  Gross Return % = (231.40 / 11,584.30) × 100 = +2.0%
```

---

## 12. PnL by Exit Scenario

### LONG (Leg 1)
| Exit Scenario | Exit Price | Formula | PnL |
|--------------|------------|---------|-----|
| Target Hit | ₹916.35 | (916.35 − 898.40) × 13 | **+₹233.35** |
| SL Hit | ₹889.40 | (889.40 − 898.40) × 13 | **−₹117.00** |
| Force Exit @ 15:24 | ₹894.00 | (894.00 − 898.40) × 13 | **−₹57.20** |

### SHORT (Leg 2)
| Exit Scenario | Exit Price | Formula | PnL |
|--------------|------------|---------|-----|
| Target Hit | ₹873.30 | (891.10 − 873.30) × 13 | **+₹231.40** |
| SL Hit | ₹900.00 | (891.10 − 900.00) × 13 | **−₹115.70** |
| Force Exit @ 15:24 | ₹894.00 | (891.10 − 894.00) × 13 | **−₹37.70** |

---

## 13. Direction Differences — Complete Reference

### Calculation Table
| Calculation | LONG (Leg 1) | SHORT (Leg 2) |
|-------------|-------------|---------------|
| **Candle Price Used** | HIGH of 5-min candle | LOW of 15-min candle |
| **Buffer Formula** | price × (1 + buffer%) | price × (1 − buffer%) |
| **Breakout Check** | LTP >= entryPrice | LTP <= entryPrice |
| **Entry Transaction** | BUY | SELL |
| **Circuit Adjustment (Entry)** | entryPrice > upper → cap to upper<br>entryPrice < lower → raise to lower | entryPrice < lower → raise to lower<br>entryPrice > upper → cap to upper |
| **SL Formula** | adjustedEntryPrice − slPoints | adjustedEntryPrice + slPoints |
| **SL Transaction** | SELL | BUY |
| **Target Formula (Profit %)** | adjustedEntryPrice × (1 + %) | adjustedEntryPrice × (1 − %) |
| **Target Formula (RR)** | adjustedEntryPrice + (slPoints × RR) | adjustedEntryPrice − (slPoints × RR) |
| **Target Transaction** | SELL | BUY |
| **Circuit Adjustment (SL)** | SL < lower → lower + 0.05 | SL > upper → upper − 0.05 |
| **Circuit Adjustment (Target)** | Target > upper → upper | Target < lower → lower |
| **Trailing SL** | DISABLED (trailingSL = -1) | DISABLED (trailingSL = -1) |
| **Trailing Target** | DISABLED (trailingTarget = -1) | DISABLED (trailingTarget = -1) |
| **Fallback SL Hit** | close <= stopLossLevel | close >= stopLossLevel |
| **Fallback Target Hit** | close >= targetLevel | close <= targetLevel |
| **Force Exit Transaction** | MARKET SELL | MARKET BUY |
| **PnL Formula** | (exit − entry) × qty | (entry − exit) × qty |

### COMMON vs PER-LEG
| Value | COMMON or PER-LEG | Reason |
|-------|------------------|--------|
| slPercent (1%) | **COMMON** | Config level — same for all legs |
| slPoints (₹) | **PER-LEG** | entryPrice differs → ₹ differs |
| capitalAtRisk (₹117.91) | **COMMON** | Same wallet, same risk % |
| quantity (shares) | **PER-LEG** | slPoints differs → qty differs |
| stopLoss (₹) | **PER-LEG** | adjustedEntry ± slPoints per leg |
| target (₹) | **PER-LEG** | adjustedEntry ± sl/percentage per leg |
| originalEntryPrice | **RAW** (pre-circuit) | As-calculated entry before circuit cap/raise |
| originalStopLoss | **RAW** (pre-circuit) | SL before post-fill circuit adjustment |
| originalTarget | **RAW** (pre-circuit) | Target before post-fill circuit adjustment |

---

## 14. Multiple Legs (N > 2) — Future

### What Changes
```
config.legs[] array can have 3, 4, or more entries:

legs[0]: Leg 1 (LONG, 5m, 09:20:30)
legs[1]: Leg 2 (SHORT, 15m, 09:30:00)
legs[2]: Leg 3 (LONG, 30m, 09:45:00)  ← future
```

### OCO with N Legs
```
Same rule: FIRST fill wins, ALL others cancelled.

Scheduler:
  Calls executePreOpenTrades for legIndex = 0, 1, 2, ...
  Each leg gets the same dualLegGroupId

OCO Monitor:
  Groups trades by dualLegGroupId
  Finds ANY leg with entryOrderStatus = "filled"
  Cancels ALL other legs' ALL orders (entry + SL + Target)

Table Display:
  Merged OCO row shows N leg columns dynamically
  Modal shows N leg detail cards
```

---

## 15. Error Scenarios & Edge Cases

### Scenario: Kite API Down at Entry Time
```
What happens:
  → KiteClient.placeOrder() throws error
  → Algo Engine catches error
  → Saves trade with status = "FAILED"
  → kiteResponse saves the error message
  → Logs to StrategyLog for debugging
  → Leg skipped this cycle, retries next cycle

Example error from Kite:
  { status: "error", message: "Connection refused: No route to host" }

DB Entry:
  status: "FAILED"
  kiteResponse: { error: "Connection refused: No route to host" }
```

### Scenario: Insufficient Capital
```
What happens:
  → capitalAtRisk calculated = ₹117.91
  → If slPoints = ₹8.984 → quantity = floor(117.91 / 8.984) = 13
  → If quantity = 0 → trade skipped

Example where qty = 0:
  If entryPrice = ₹10,000 and slPercent = 1%
  slPoints = 10,000 × 0.01 = 100
  qty = floor(117.91 / 100) = 1 (just barely qualifies)

  If entryPrice = ₹12,000:
  slPoints = 12,000 × 0.01 = 120
  qty = floor(117.91 / 120) = 0 → SKIP (can't afford even 1 share)
```

### Scenario: No Candle Data at Entry Time
```
What happens:
  → KiteClient.getHistoricalData() returns empty
  → Algo Engine checks: candles.length === 0?
  → If no candles → skip this leg, retry next cycle
  → Logs warning to StrategyLog
```

### Scenario: Order Placed But Kite Returns Error
```
What happens:
  → KiteClient.placeOrder() partially succeeds
  → Entry order placed → order_id returned
  → SL/Target orders fail → error returned

DB State:
  entryOrderId: "kite_entry_001" (success)
  entryOrderStatus: "pending"
  slOrderStatus: "REJECTED"
  targetOrderStatus: "REJECTED"

Scheduler Action:
  → Retry placing SL/Target in next cycle
  → If still failing → log to StrategyLog
```

### Scenario: Client Disabled Mid-Day
```
What happens:
  → Admin sets client.tradingStatus = "inactive"
  → Scheduler checks before each action
  → If inactive → skip all trading for this client
  → Existing open trades continue to be monitored
  → No new entry orders placed
```

### Scenario: Strategy Config Changed Mid-Day
```
What happens:
  → Admin updates strategy in DB
  → Scheduler reads fresh config each cycle
  → If legs changed mid-day:
    → Already placed entries continue (existing orders)
    → Retry logic uses NEW config
  → Recommendation: Don't change config mid-day
```

---

## 16. DB Trade Records — Complete Example

### Active Trade (Leg 1 Won, Open Position)
```sql
Trade #1 — Leg 1 (LONG) — Active:
  id: "abc-123"
  clientId: "b364d72f-..."
  strategyId: "c7bafa89-..."
  symbol: "JSWSTEEL"
  direction: "LONG"
  legName: "Leg 1"
  legTimeframe: "5m"
  dualLegGroupId: "a1b2c3d4-..."
  
  entryPrice: 898.40
  stopLoss: 889.40
  target: 916.35
  quantity: 13
  status: "open"
  
  entryOrderId: "kite_entry_l1_001"
  entryOrderStatus: "filled"
  slOrderId: "kite_sl_l1_001"
  slOrderStatus: "pending"
  targetOrderId: "kite_tgt_l1_001"
  targetOrderStatus: "pending"
  
  entryTime: "2026-06-25T09:20:30.000Z"
```

### Cancelled Trade (Leg 2 Lost — OCO Cancelled)
```sql
Trade #2 — Leg 2 (SHORT) — Cancelled by OCO:
  id: "def-456"
  clientId: "b364d72f-..."
  strategyId: "c7bafa89-..."
  symbol: "JSWSTEEL"
  direction: "SHORT"
  legName: "Leg 2"
  legTimeframe: "15m"
  dualLegGroupId: "a1b2c3d4-..." -- SAME as Leg 1
  
  entryPrice: 891.10
  stopLoss: 900.00
  target: 873.30
  quantity: 13
  status: "cancelled"
  
  entryOrderId: "kite_entry_l2_001"
  entryOrderStatus: "cancelled"
  slOrderId: "kite_sl_l2_001"
  slOrderStatus: "cancelled"
  targetOrderId: "kite_tgt_l2_001"
  targetOrderStatus: "cancelled"
  exitReason: "OCO_CANCELLED — Leg 1 filled first"
  
  entryTime: "2026-06-25T09:30:00.000Z"
```

### Closed Trade (Target Hit)
```sql
Trade #1 — Leg 1 (LONG) — Closed (Target Hit):
  status: "closed"
  exitPrice: 916.35
  pnl: 233.35
  
  slOrderStatus: "cancelled"  -- cancelled when target hit
  targetOrderId: "kite_tgt_l1_001"
  targetOrderStatus: "filled"
  
  exitTime: "2026-06-25T14:45:00.000Z"
  exitReason: "TARGET_HIT"
```

### Failed Trade (Kite Rejected)
```sql
Trade #3 — Leg 1 (LONG) — Failed:
  status: "FAILED"
  entryOrderStatus: "REJECTED"
  kiteResponse: {
    "status": "error",
    "message": "RMS: Margin insufficient | Exposure > Exposure limit"
  }
```

---

## 17. OCO Monitor — Detailed Logic

### Every Cycle (60 seconds)
```
Step 1: Query DB for today's trades
  SELECT * FROM trades
  WHERE dualLegGroupId IS NOT NULL
    AND DATE(entry_time) = CURRENT_DATE

Step 2: Group by dualLegGroupId
  Group "a1b2c3d4-...":
    → Trade 1: Leg 1, status = "open", entryOrderStatus = "filled"
    → Trade 2: Leg 2, status = "pending", entryOrderStatus = "pending"

Step 3: For each group, check OCO condition
  Is there EXACTLY 1 leg with entryOrderStatus = "filled"?
  → YES → This is the WINNER
  → Find LOSER(s): all other legs in same group
  → Cancel LOSER leg's ALL orders:

    For each loser leg:
      1. Kite.cancelOrder(loser.entryOrderId)
         → If success: DB update entryOrderStatus = "cancelled"
         → If error: log and continue

      2. Kite.cancelOrder(loser.slOrderId)
         → If success: DB update slOrderStatus = "cancelled"
         → If error: log and continue

      3. Kite.cancelOrder(loser.targetOrderId)
         → If success: DB update targetOrderStatus = "cancelled"
         → If error: log and continue

      4. DB update:
         loser.status = "cancelled"
         loser.exitReason = "OCO_CANCELLED"

Step 4: Edge cases
  All legs still "pending" → Do nothing, keep waiting
  All legs "cancelled" → Already processed, skip
  Multiple legs "filled" → Rare race condition → handle separately
```

### OCO States & DB Status
| OCO State | Leg 1 Status | Leg 2 Status | UI Badge |
|-----------|-------------|-------------|----------|
| Both Pending | pending | pending | BOTH PENDING |
| Leg 1 Won | open/filled | cancelled | LEG 1 ACTIVE |
| Leg 2 Won | cancelled | open/filled | LEG 2 ACTIVE |
| Both Cancelled | cancelled | cancelled | ALL CANCELLED |
| Both Filled (race) | open/filled | open/filled | BOTH FILLED |

---

## 18. ALL Conditions — Complete List

### Pre-Select Conditions (from config.conditions[])
| Condition | Operator | Value | Purpose |
|-----------|----------|-------|---------|
| Pre Open Change % | > | -10 | Stocks with change% **below -10%** are filtered out (extreme losers skipped) |

**Config Source:**
```json
{
  "conditions": [
    {
      "value": "-10",
      "logical": "AND",
      "operator": ">",
      "indicator": "Pre Open Change %"
    }
  ]
}
```

**How it works:**
1. All pre-open NSE F&O stocks are fetched
2. Condition applied: `changePercent > -10`
3. Stocks with -10% or below → skipped
4. Remaining stocks sorted ascending (LONG direction)
5. `selectPosition = 1` → top loser selected

**Example:**
```
Stock          Change%    > -10?    Result
COAL INDIA     -12.0%    NO        ✗ SKIP (extreme loser)
JSW STEEL      -8.0%     YES       ✓ PASS, Rank #1 → SELECTED
HINDALCO       -4.8%     YES       ✓ PASS, Rank #2
CANBK          +3.2%     YES       ✓ PASS, Rank #3
```

---

## 19. UI — How Data Displays

### Merged OCO Row in Table
```
| Date/Time    | Client       | Strategy | Symbol   | Type   | Leg 1 (LONG)                 | Leg 2 (SHORT)                | Exit Reason | Exit Price | Exit Time    | OCO Status     | P&L       |
|--------------|-------------|----------|----------|--------|------------------------------|------------------------------|-------------|------------|--------------|----------------|-----------|
| 25 Jun, 9:20 | Vikash      | Pre-Open | JSWSTEEL | BUY    | LONG | Qty:13                      | SHORT | Qty:13                     | --          | --         | --           | LEG 1 ACTIVE   | +₹233.35  |
|              | Sharma      | Momentum |          | SELL   | Entry:₹898.40                | Entry:₹891.10                |             |            |              |                |           |
|              |             |          |          |        | SL:₹889.40 | Tgt:₹916.35    | SL:₹900.00 | Tgt:₹873.30    |             |            |              |                |           |
|              |             |          |          |        | E:FILL SL:PDNG T:PDNG       | E:CNCL SL:CNCL T:CNCL      |             |            |              |                |           |
|              |             |          |          |        | [CIRCUIT] (if adjusted)      |                             |             |            |              |                |           |
```

**Circuit Adjustment Display Rules:**
- Agar `originalEntryPrice ≠ entryPrice` ya `originalStopLoss ≠ stopLoss` ya `originalTarget ≠ target` → **CIRCUIT** badge dikhao
- Original values ko strikethrough (`~~₹898.40~~`) ke saath actual value ke aage dikhao
- Example (circuit-adjusted case):
  ```
  Entry: ₹920.00 (~~₹930.00~~)    ← original capped
  SL: ₹870.05 (~~₹865.00~~)       ← original raised
  Tgt: ₹920.00 (~~₹940.00~~)      ← original capped
  [CIRCUIT]
  ```

### Modal (Click Row) — Shows ALL Leg Details
```
┌─────────────────────────────────────────────────────┐
│  OCO Trade Details — All Legs                       │
│                                                     │
│  Symbol: JSWSTEEL  │  Strategy: Pre-Open Momentum    │
│  Client: Vikash    │  OCO Group: a1b2c3d4-...        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌── Leg 1 (LONG/BUY) ──────────────────────┐       │
│  │ Direction: LONG    Timeframe: 5m          │       │
│  │ Entry: ₹898.40     Qty: 13                │       │
│  │ SL: ₹889.40        Target: ₹916.35        │       │
│  │ Orig Entry: ₹898.40 (pre-circuit)         │       │
│  │ Orig SL: ₹889.416 (pre-circuit)           │       │
│  │ Orig Target: ₹916.368 (pre-circuit)       │       │
│  │ Entry Order: kite_entry_l1_001 → FILLED   │       │
│  │ SL Order: kite_sl_l1_001 → PENDING        │       │
│  │ Target Order: kite_tgt_l1_001 → PENDING   │       │
│  │ Kite Response: {...}                       │       │
│  └──────────────────────────────────────────┘       │
│                                                     │
│  ┌── Leg 2 (SHORT/SELL) ────────────────────┐       │
│  │ Direction: SHORT   Timeframe: 15m         │       │
│  │ Entry: ₹891.10     Qty: 13                │       │
│  │ SL: ₹900.00        Target: ₹873.30        │       │
│  │ Orig Entry: ₹891.10 (pre-circuit)         │       │
│  │ Orig SL: ₹900.011 (pre-circuit)           │       │
│  │ Orig Target: ₹873.278 (pre-circuit)       │       │
│  │ Entry Order: kite_entry_l2_001 → CANCELLED│       │
│  │ SL Order: kite_sl_l2_001 → CANCELLED      │       │
│  │ Target Order: kite_tgt_l2_001 → CANCELLED │       │
│  └──────────────────────────────────────────┘       │
│                                                     │
│  [Close]                                            │
└─────────────────────────────────────────────────────┘
```
