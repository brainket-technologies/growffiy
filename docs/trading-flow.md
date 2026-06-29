# 📊 Trading Flow — Har Line Ka Calculation

## Real Data
| Item | Value | Source |
|------|-------|--------|
| Client | Vikash Sharma | DB |
| Zerodha Wallet (equity.net) | ₹11,791.70 | Live Kite API (25 June 2026) |
| DB Capital (client.capital) | ₹5,00,000 | DB |
| Strategy | Pre-Open Momentum Breakout | DB |
| Config Conditions | `riskPerTrade: 1` | DB configJson (Updated to 1%) |
| Selected Stock | CANBK | Pre-select sort |
| 5-min Candle High | ₹488 | Kite historical |
| Entry Trigger Price | ₹488.50 | breakoutEntryPrice (after 0.05 tick round) |

---

## Code Execution — Line by Line (Updated with latest DB and logic fixes)

### 1. marginCache Check (Pre-select 09:15:30 se)
```
marginRes = await KiteClient.getMargins(client.zerodhaApiKey, client.accessToken)
this.marginCache.set(client.id, Number(marginRes.data.equity.net))
         = Number(11791.7)
         = 11791.70
```
marginCache["b364d72f-..."] = **₹11,791.70** ✅

---

### 2. Candle Price Fetch (Entry 09:20:30)
```
KiteClient.getHistoricalData(apiKey, token, instToken, '5minute', from, to)
candleType = config.tradeAction?.candlePriceType || 'high'
candlePrice = Number(res.data.candles[0][2])   // index 2 = high
            = 488
```
candlePrice = **₹488** ✅

---

### 3. Breakout Entry Price
```
bufferPct = config.tradeAction?.bufferPercent = 0.1
breakoutEntryPrice = candlePrice * (1 + bufferPct / 100)
            = 488 * (1 + 0.1/100)
            = 488 * 1.001
            = 488.488

finalEntryPrice = getTickSizeAndRound('NSE', 'CANBK', 488.488) 
                = Math.round(488.488 / 0.05) * 0.05 
                = 488.50
```
breakoutEntryPrice = **₹488.50** (tick size applied successfully)

---

### 4. Breakout Check
```
isSLMarket = config.tradeAction?.orderType === 'SL-Market'
           = 'SL-Market' === 'SL-Market'
           = true
if (isSLMarket || !hasPriceAction || currentLtp >= breakoutEntryPrice)
           if (true) → targetStock = candidateStock (CANBK) ✅
```
SL-Market hai → price check skip, order khud trigger handle karega.

---

### 5. Client Capital — EXACT

#### Step 5a: marginOrApi & DB Capital
```
cachedMargin = this.marginCache.get(client.id) = 11791.70
dbCapital = Number(client.capital) = 500000
```

#### Step 5b: clientCapital
```
dbDisabled = (dbCapital === -1) = false
clientCapital = dbDisabled ? marginOrApi : Math.min(marginOrApi, dbCapital)
            = Math.min(11791.70, 500000)
            = 11791.70
```
clientCapital = **₹11,791.70** ✅ (wallet or DB dono me minimum)

---

### 6. Capital At Risk (Now 1% from DB)
```
riskPercent = config.riskManagement.riskPerTrade = 1  // DB se uthaya (previously 3)
capitalAtRisk = clientCapital * (riskPercent / 100)
            = 11791.70 * (1 / 100)
            = 11791.70 * 0.01
            = 117.917
```
capitalAtRisk = **₹117.917**

---

### 7. Stop Loss Points
```
slPercent = config.stoploss.fixedPercent = 1
slPoints = entryPrice * (slPercent / 100)
         = 488.50 * (1 / 100)
         = 4.885
```
slPoints = **₹4.885** ✅

---

### 8. Quantity Calculation
```
quantity = Math.floor(capitalAtRisk / slPoints)
         = Math.floor(117.917 / 4.885)
         = Math.floor(24.138)
         = 24
```
quantity = **24 shares** ✅

---

### 9. Stop Loss Price (Target & SL Order Prep)
```
stopLoss = entryPrice - slPoints
         = 488.50 - 4.885
         = 483.615

finalStopLoss = getTickSizeAndRound('NSE', 'CANBK', 483.615) 
              = 483.60
```
stopLoss = **₹483.60** (Perfectly tick size rounded)

---

### 10. Target Price
```
targetPercent = config.target.profitPercent = 2
target = entryPrice * (1 + targetPercent / 100)
       = 488.50 * (1 + 2/100)
       = 488.50 * 1.02
       = 498.27

finalTarget = getTickSizeAndRound('NSE', 'CANBK', 498.27) 
            = Math.round(498.27 / 0.05) * 0.05 
            = 498.25
```
target = **₹498.25** (Perfectly tick size rounded)

---

### 11. Initial Entry Order Placed
```
KiteClient.placeOrder(apiKey, token, {
    exchange: 'NSE',
    tradingsymbol: 'CANBK',
    transaction_type: 'BUY',
    quantity: 24,
    order_type: 'SL-M',
    product: 'MIS',
    trigger_price: 488.50
})
```

---

### 12. Trade Fill & Placement of Secondary Orders (Runtime Logic)
Jab 1st order **COMPLETE** hota hai:
1. `SL-M SELL 24 CANBK @ trigger 483.60` place hota hai.
2. Uska Kite Response DB mein `slKiteResponse` column mein save hota hai.
3. `LIMIT SELL 24 CANBK @ limit 498.25` place hota hai.
4. Uska Kite Response DB mein `targetKiteResponse` column mein save hota hai.

**Error Handling / Logging:** Agar Kite ye Secondary order reject karta hai (jaise tick size mismatch 0.05 ka tha pehle, ab fixed hai), toh `slOrderStatus: 'REJECTED'` mark hoga aur system log ban jayega + Runtime Log mein display hoga.

---

### 13. Market Close (Force Exit at 15:24)
Agar market window 15:24 pe band hota hai:
1. Algo check karega agar koi `openTradesCount > 0` bacha hai.
2. Agar bacha hai toh woh continue monitoring rakhega (loop band nahi hoga).
3. `isPastForceExitTime` trigger hoga.
4. **Important Fix:** Existing pending Target and Stop Loss orders Kite API mein explicitly **CANCEL** kiye jayenge.
5. Fir ek market `SELL` order mara jayega.
6. Jab ye order **COMPLETE** hoga tab Trade status `CLOSED` mark hoga Admin panel mein.

---

## 📌 Summary — All Calculated Values (Final Live Flow)

| Variable | Source / Line | Expression | Result |
|----------|-----------|-----------|--------|
| clientCapital | marginCache | Math.min(11791.70, 500000) | **₹11,791.70** |
| riskPercent | DB (Updated) | `config.riskManagement.riskPerTrade` | **1** |
| capitalAtRisk | Line 729 | 11791.70 × 1/100 | **₹117.91** |
| quantity | Line 783 | Math.floor(117.91 / 4.885) | **24 shares** |
| triggerPrice | Tick Rounded | 488.488 → Nearest 0.05 | **₹488.50** |
| stopLoss | Tick Rounded | 483.615 → Nearest 0.05 | **₹483.60** |
| target | Tick Rounded | 498.270 → Nearest 0.05 | **₹498.25** |

*(Runtime Logs feature ab live hai. Kisi bhi background process ko monitor karne ke liye 'App Runtime Logs' dashboard use karein.)*
