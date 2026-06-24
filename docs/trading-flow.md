# 📊 Trading Flow — Har Line Ka Calculation

## Real Data
| Item | Value | Source |
|------|-------|--------|
| Client | Vikash Sharma | DB |
| Zerodha Wallet (equity.net) | ₹11,791.70 | Live Kite API (25 June 2026) |
| DB Capital (client.capital) | ₹5,00,000 | Seed/DB |
| Strategy | Pre-Open Momentum Breakout | DB |
| Config Conditions | [] (empty) | configJson |
| Selected Stock | CANBK | Pre-select sort |
| 5-min Candle High | ₹488 | Kite historical |
| Entry Trigger Price | ₹488.50 | breakoutEntryPrice (after tick round) |

---

## Code Execution — Line by Line

### 1. marginCache Check (Pre-select 09:15:30 se)
```
Line 346: marginRes = await KiteClient.getMargins(client.zerodhaApiKey, client.accessToken)
Line 348: this.marginCache.set(client.id, Number(marginRes.data.equity.net))
         = Number(11791.7)
         = 11791.70
```
marginCache["b364d72f-..."] = **₹11,791.70** ✅

---

### 2. Candle Price Fetch (Entry 09:20:30)
```
Line 539: KiteClient.getHistoricalData(apiKey, token, instToken, '5minute', from, to)
Line 543: candleType = config.tradeAction?.candlePriceType || 'high'
Line 545: candlePrice = Number(res.data.candles[0][2])   // index 2 = high
            = 488
```
candlePrice = **₹488** ✅

---

### 3. Breakout Entry Price
```
Line 601: bufferPct = config.tradeAction?.bufferPercent = 0.1
Line 604: breakoutEntryPrice = candlePrice * (1 + bufferPct / 100)
            = 488 * (1 + 0.1/100)
            = 488 * 1.001
            = 488.488
Line 878: finalEntryPrice = getTickSizeAndRound(..., 488.488) = 488.50
```
breakoutEntryPrice = **₹488.50** (rounded to tick size)

---

### 4. Breakout Check
```
Line 608: isSLMarket = config.tradeAction?.orderType === 'SL-Market'
           = 'SL-Market' === 'SL-Market'
           = true
Line 610: if (isSLMarket || !hasPriceAction || currentLtp >= breakoutEntryPrice)
           if (true) → targetStock = candidateStock (CANBK) ✅
```
SL-Market hai → price check skip, order khud trigger handle karega.

---

### 5. entryPrice
```
Line 616: const entryPrice = breakoutEntryPrice
           = 488.50
```

---

### 6. slPercent and targetPercent
```
Line 636: slPercent = config.stoploss.fixedPercent = 1
Line 637: targetPercent = config.target.profitPercent = 2
```

---

### 7. Access Token Check
```
Line 639: activeAccessToken = client.accessToken = "nKDLbxnRhHFcvp6BCqqFkwvwcIlTAzyq"
Line 640: isAutoLoginPossible = process.env.KITE_AUTO_LOGIN_ENABLED === 'true'
                               && client.zerodhaPassword
                               && client.zerodhaTotpSecret
```
activeAccessToken exists ✅, no auto-login needed.

---

### 8. Client Capital — EXACT

#### Step 8a: marginOrApi
```
Line 706: cachedMargin = this.marginCache.get(client.id) = 11791.70
Line 713: marginOrApi = cachedMargin = 11791.70
```
marginOrApi = **₹11,791.70** (from marginCache)

#### Step 8b: dbCapital
```
Line 707: dbCapital = Number(client.capital) = Number(500000) = 500000
```
dbCapital = **₹5,00,000**

#### Step 8c: Check DB disabled?
```
Line 710: dbDisabled = (dbCapital === -1) = (500000 === -1) = false
```

#### Step 8d: clientCapital
```
Line 722: clientCapital = dbDisabled ? marginOrApi : Math.min(marginOrApi, dbCapital)
            = Math.min(11791.70, 500000)
            = 11791.70
```
clientCapital = **₹11,791.70** ✅ (wallet are DB dono me最小值)

---

### 9. Risk Percent
```
Line 726: riskPercent = config.riskManagement.riskPerTrade = 3
```

### 10. marginRate
```
Line 727: marginRate = config?.riskManagement?.misMarginRate = -1  (disabled)
```

---

### 11. capitalAtRisk — EXACT

#### Step 11a: Base calculation
```
Line 729: capitalAtRisk = clientCapital * (riskPercent / 100)
            = 11791.70 * (3 / 100)
            = 11791.70 * 0.03
            = 353.751
```
capitalAtRisk = **₹353.751**

#### Step 11b: capitalAllocation cap
```
Line 731: capitalAllocPct = config?.riskManagement?.capitalAllocation = -1
Line 732: if (-1 > 0) → false → skip
```

#### Step 11c: dbCapitalLimit cap
```
Line 739: dbCapitalLimit = Number(client.capital) = 500000
Line 740: if (500000 !== -1 && 353.751 > 500000)
            if (true && false) → false → skip
```

#### Step 11d: FINAL capitalAtRisk
```
capitalAtRisk = ₹353.751
```

---

### 12. Stop Loss Points — EXACT

#### Step 12a: slType
```
Line 748: slType = config.stoploss.type = 'Trailing SL'
```

#### Step 12b: slPoints
```
Line 749: if (slType === 'Fixed Points') → false
Line 756: else if (slType === 'Risk %') → false
Line 762: else → slPoints = entryPrice * (slPercent / 100)
            = 488.50 * (1 / 100)
            = 488.50 * 0.01
            = 4.885
```
slPoints = **₹4.885**

#### Step 12c: Minimum check
```
Line 765: if (slPoints <= 0) slPoints = 1
            if (4.885 <= 0) → false → skip
```
slPoints = **₹4.885** ✅

---

### 13. Quantity — EXACT

#### Step 13a: Base calculation
```
Line 783: quantity = Math.floor(capitalAtRisk / slPoints)
            = Math.floor(353.751 / 4.885)
            = Math.floor(72.416...)
            = 72
```
quantity = **72 shares**

#### Step 13b: misMarginRate cap
```
Line 785: marginRate = -1
          if (-1 > 0) → false → skip
```

#### Step 13c: quantity ≤ 0 check
```
Line 790: if (quantity <= 0) → if (72 <= 0) → false → proceed
```
quantity = **72** → NOT failed ✅

---

### 14. Kill Switch
```
Line 810: killSwitch = config?.riskManagement?.killSwitch === true = false === true = false
           if (false) → skip
```

---

### 15. Max Open Positions
```
Line 816: maxOpen = config?.riskManagement?.maxOpenPositions = 3
Line 818: openCount = prisma.trade.count({ where: { clientId, strategyId, status: 'open' } })
           = 0 (assuming no open trades)
Line 821: if (0 >= 3) → false → proceed
```

---

### 16. Daily Limits
```
Line 833: maxDailyLoss = config?.riskManagement?.maxDailyLoss = -1
          if (-1 !== undefined && -1 !== null && -1 !== -1) → (false) → skip

Line 838: maxDailyProfit = config?.riskManagement?.maxDailyProfit = -1
          if (-1 !== undefined && -1 !== null && -1 !== -1) → (false) → skip
```

---

### 17. Stop Loss Price — EXACT
```
Line 848: stopLoss = entryPrice - slPoints
            = 488.50 - 4.885
            = 483.615
Line 879: finalStopLoss = getTickSizeAndRound(..., 483.615) = 483.60
```
stopLoss = **₹483.60**

---

### 18. Target Price — EXACT
```
Line 854: targetType = config.target.type = 'Trailing Target'
Line 856: if (targetType === 'Risk Reward Ratio') → false
Line 864: target = entryPrice * (1 + targetPercent / 100)
            = 488.50 * (1 + 2/100)
            = 488.50 * 1.02
            = 498.27
Line 880: finalTarget = getTickSizeAndRound(..., 498.27) = 498.30
```
target = **₹498.30**

---

### 19. Order Type
```
Line 909: configOrderType = config.tradeAction.orderType = 'SL-Market'
          if ('SL-Market' === 'SL-Market') → true
Line 910: orderTypeParam = 'SL-M'
Line 911: triggerPriceParam = finalEntryPrice = 488.50
```
Order: **SL-M** (Stop Loss Market), Trigger: **₹488.50**

---

### 20. ORDER PLACED
```
KiteClient.placeOrder(apiKey, token, {
    exchange: 'NSE',
    tradingsymbol: 'CANBK',
    transaction_type: 'BUY',
    quantity: 72,
    order_type: 'SL-M',
    product: 'MIS',
    validity: 'DAY',
    trigger_price: 488.50
})
```

---

### 21. Order Polling (Fill Check)
```
Line 938: maxPolls = 30
Line 941: setTimeout(2000)  // har 2 second check

Attempt 1: orderStatus = KiteClient.getOrderById(...)
           if status === 'COMPLETE' → false (trigger pending)
Attempt 2: status = 'COMPLETE' → true ✅

           filledAvgPrice = orderStatusRes.data.average_price = 489.20
           actualEntryPrice = 489.20

           // Entry fill -> place SL-M SELL + LIMIT SELL
           SL-M SELL 72 CANBK @ trigger 483.60
           LIMIT SELL 72 CANBK @ 498.30
```

---

### 22. TRADE CREATED
```
prisma.trade.create({
    clientId: "b364d72f-...",
    symbol: "CANBK",
    quantity: 72,
    entryPrice: 489.20,
    stopLoss: 483.60,
    target: 498.30,
    status: 'open',
    entryOrderId: "240626000xxxxx"
})
```

---

## Summary — All Calculated Values

| Variable | Code Line | Expression | Result |
|----------|-----------|-----------|--------|
| marginOrApi | 713 | marginCache.get() | ₹11,791.70 |
| dbCapital | 707 | Number(client.capital) | ₹5,00,000 |
| clientCapital | 722 | Math.min(11791.70, 500000) | **₹11,791.70** |
| riskPercent | 726 | config.riskManagement.riskPerTrade | **3** |
| capitalAtRisk | 729 | 11791.70 × 3/100 | **₹353.75** |
| slPercent | 636 | config.stoploss.fixedPercent | **1** |
| slPoints | 762 | 488.50 × 1/100 | **₹4.885** |
| quantity | 783 | Math.floor(353.75 / 4.885) | **72 shares** |
| stopLoss | 848 | 488.50 - 4.885 → tick round | **₹483.60** |
| target | 864 | 488.50 × 1.02 → tick round | **₹498.30** |
| orderType | 910 | config.tradeAction.orderType | **SL-Market** |
| triggerPrice | 911 | finalEntryPrice | **₹488.50** |

## Important
- Code me **koi lot size check nahi hai** — 72 shares ka order place hoga
- CANBK F&O ka lot size 100 hai, lekin code ye check nahi karta
- Agar Kite API lot size enforce karegi to order API side se reject ho sakta hai
- Agar DB capital = -1 hota to `dbDisabled = true`, sirf live margin use hota
