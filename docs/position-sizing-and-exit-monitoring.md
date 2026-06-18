# Position Sizing and Active Trade Exit Monitoring

This document describes the trading engine's position sizing, capital capping, and exit monitoring logic, along with a real-client example using Vikash Sharma's Demat data.

---

## 1. Trade Entry & Position Sizing Rules

When a buy signal is triggered (at 09:15 AM IST), the engine performs the following calculations to size the order:

### Step 1: Calculate Target Allocation
Query the client's live cash balance (net equity margin) from Zerodha Kite.
Calculate the target trade size as **1%** (or configured `riskPerTrade%` from strategy config) of this balance:
$$\text{Target Allocated Amount} = \text{Live Wallet Cash} \times 0.01$$

### Step 2: Compare and Cap with Database Capital Limit
Compare the calculated target allocation with the client's configured capital limit in the database (`client.capital`):
- **Case A (1% of Live Wallet > DB Capital Limit):**
  Cap the trade size at the DB Capital Limit.
  $$\text{Allocated Amount} = \text{DB Capital Limit}$$
- **Case B (1% of Live Wallet <= DB Capital Limit):**
  Use the calculated 1% of the live wallet balance directly.
  $$\text{Allocated Amount} = \text{Target Allocated Amount}$$

### Step 3: Quantity Sizing
Divide the final allocated amount by the stock's entry price:
$$\text{Quantity} = \lfloor \frac{\text{Allocated Amount}}{\text{Entry Price}} \rfloor$$

If the resulting quantity is **0** (i.e. the allocated trade value is less than a single share's price), the system **skips** the trade execution for this client.

---

## 2. Active Trade Exit Monitoring (5-min Candles)

For all open trades in the database, the engine periodically monitors exit conditions on **5-minute candles**:

1. **Check Interval:** Every 1 minute, the engine checks all open trades.
2. **Candle Retrieval:** Fetches historical 5-minute interval candle data from Zerodha Kite for the trade's symbol.
3. **Price Trigger levels:**
   - **Stop Loss (SL):** **0.5%** below the entry price:
     $$\text{Stop Loss Level} = \text{Entry Price} \times (1 - 0.005)$$
   - **Target:** **1.5%** (or configured `profitPercent%`) above the entry price:
     $$\text{Target Level} = \text{Entry Price} \times (1 + \text{Target Percent})$$
4. **Trigger Check:** At the close of a 5-minute candle, if the closing price breaches either the Stop Loss or Target level, a market SELL order is immediately sent to Zerodha to close the position. The trade status in the DB is then updated to `closed`, and the P&L is recorded.

---

## 3. Real Example: Vikash Sharma (Client ID: RZJ500)

Using the real database configurations and live Demat cash balance for Vikash Sharma:

### Client Parameters:
- **Live Cash Balance (Zerodha Wallet):** ₹709.80 (fetched in real-time)
- **DB Capital Limit:** ₹50,000
- **Strategy:** *Pre Open Momentum Breakout* (1% Risk, 0.5% SL, 1.5% Target)

### Execution Trace:

#### A. Trade Entry (e.g. INFY @ ₹1142.90)
1. **Target Allocation:** $₹709.80 \times 1\% = ₹7.10$.
2. **Capping Check:** Since $₹7.10 \le ₹50,000$ (DB Capital), the allocated amount is **₹7.10**.
3. **Quantity Sizing:** $\lfloor \frac{₹7.10}{₹1142.90} \rfloor = 0$ shares.
4. **Result:** Quantity is 0; the trade is **skipped** for this client.

*(Note: If Vikash's Zerodha wallet had ₹80,000, 1% would be ₹800. For TATASTEEL @ ₹198, Quantity = $\lfloor \frac{₹800}{₹198} \rfloor$ = 4 shares. A buy order of 4 shares would be placed).*

#### B. Trade Exit (e.g. 4 shares of TATASTEEL @ ₹198.00)
1. **SL / Target Levels:**
   - **Stop Loss Level:** $₹198.00 \times 0.995 = ₹197.01$
   - **Target Level:** $₹198.00 \times 1.015 = ₹200.97$
2. **Candle Monitoring:** The engine polls the latest 5-min candle. If the closing price of a 5-minute candle is $\le ₹197.01$ or $\ge ₹200.97$, the system immediately sells the 4 shares and marks the trade as `closed` in the DB.

---

## 4. Database Strategy Matching & Parameter Routing

Below is the code-level implementation details of how the database configurations match and route trades for active clients:

### A. Parameter Routing and Product Type Mapping
The engine maps the user's strategy trade types directly to Zerodha order parameters:
* **Exchange Routing:** Determined dynamically by the strategy config (`config.basicInfo.exchange`, defaults to `'NSE'`).
* **Product Type Mapping:**
  * If `tradeType` is `'Delivery'` $\rightarrow$ Maps to **`CNC`**
  * If `tradeType` is `'Carry Forward'`, `'Normal'`, or `'NRML'` $\rightarrow$ Maps to **`NRML`**
  * Otherwise (e.g. `'Intraday'`) $\rightarrow$ Maps to **`MIS`**

### B. Segment Filtering
Before processing conditions, the pre-open stock list is filtered dynamically:
* **NSE F&O:** Only stocks with F&O enabled are scanned (`stock.isFo === true`).
* **Nifty 50:** Only Nifty 50 stocks are scanned (`stock.isNifty50 === true`).
* **Bank Nifty:** Only Bank Nifty stocks are scanned (`stock.isBankNifty === true`).

### C. Condition Evaluation (e.g. Vikash Sharma's Config)
* **Condition 1 (Pre Open Change % < 0):** Only scans and selects stocks that open negative (gap-down).
* **Condition 2 (Price Action > Previous 5m High):** Only enters a trade if the current price exceeds the previous candle high.
* **Target Stock Selection:** Because Vikash's strategy is a **Long** momentum breakout, the engine picks the stock with the **lowest changePercent** (maximum gap-down) from the filtered list to maximize recovery upside.

