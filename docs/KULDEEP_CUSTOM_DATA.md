# Kuldeep Singh Verma (TV6983) - Custom Winning Trades & P&L Record

> **Document Type:** Client Data Modification & Rollback Manual  
> **Client Name:** Kuldeep Singh Verma  
> **Zerodha Client ID:** `TV6983`  
> **Client DB UUID:** `a6ad5d1d-1da9-40b9-b14d-72bc4f60e65c`  
> **Client Capital:** ₹25,000.00  
> **Created At:** 2026-11-26  

---

## 1. Upper P&L Overview & Metrics

In accordance with user instructions, the artificial multiplier (0.8 / 1.8) has been **completely disabled** (`KULDEEP_PNL_MULTIPLIER = 1.0` in `src/shared/utils/temporaryOverrides.ts`). Instead, 11 winning trades were directly added to the database with the exact required P&L of **+₹3,338.30**, which naturally produces the exact target amount:

$$\text{Final Total P\&L} = \text{₹4,095.93 (Existing DB P\&L)} + \text{₹3,338.30 (11 Winning Trades)} = \mathbf{₹7,434.23}$$

### Summary Cards Breakdown:

| Metric | Value | Details / Calculation |
| :--- | :--- | :--- |
| **TOTAL P&L (₹)** | **₹7,434.23** | **↑ 29.74% of cap.** (based on ₹25,000 capital) |
| **NET PROFIT (₹)** | **₹15,151.07** | Existing wins (₹11,812.77) + 11 new wins (+₹3,338.30) |
| **NET LOSS (₹)** | **₹7,716.84** | Original 20 losing trades preserved without changes |
| **WIN RATE** | **59.2%** | 29 winning trades out of 49 total closed trades |
| **TOTAL TRADES** | **49** | 29 winning trades, 20 losing trades |

---

## 2. Strategies Used

The 11 trades belong exclusively to these 2 strategies:
1. `Bull 5M 2X ` (UUID: `866c5f13-0357-4b7d-8bd4-26d2a09c2105`) — 6 Long trades
2. `Bear 5M 2X ` (UUID: `68dbbeb8-9162-40ad-91f2-f5053767e69b`) — 5 Short trades

---

## 3. Detailed Specification of the 11 Winning Trades

All trades have unique UUIDs formatted with prefix `c001dea0-` for safe tracking and 1-step deletion.

| # | Trade ID | Date (IST) | Strategy | Symbol | Direction | Entry (₹) | Exit (₹) | Qty | P&L (₹) | Status | Entry Order ID | Target Order ID |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **1** | `c001dea0-0001-4000-8000-000000000001` | 24 Nov 2026, 09:22 AM | Bull 5M 2X | TATASTEEL | LONG | 151.20 | 154.80 | 85 | **+306.00** | Target Hit | 261124170081201 | 261124170138942 |
| **2** | `c001dea0-0001-4000-8000-000000000002` | 24 Nov 2026, 09:45 AM | Bull 5M 2X | HDFCBANK | LONG | 1,742.50 | 1,765.00 | 16 | **+360.00** | Target Hit | 261124170094112 | 261124170172304 |
| **3** | `c001dea0-0001-4000-8000-000000000003` | 24 Nov 2026, 10:40 AM | Bear 5M 2X | AXISBANK | SHORT | 1,180.00 | 1,166.50 | 20 | **+270.00** | Target Hit | 261124170119853 | 261124170198421 |
| **4** | `c001dea0-0001-4000-8000-000000000004` | 25 Nov 2026, 09:21 AM | Bull 5M 2X | INFY | LONG | 1,870.00 | 1,892.40 | 12 | **+268.80** | Target Hit | 261125170078921 | 261125170142851 |
| **5** | `c001dea0-0001-4000-8000-000000000005` | 25 Nov 2026, 09:50 AM | Bear 5M 2X | LT | SHORT | 3,540.00 | 3,505.00 | 9 | **+315.00** | Target Hit | 261125170099412 | 261125170183190 |
| **6** | `c001dea0-0001-4000-8000-000000000006` | 25 Nov 2026, 10:35 AM | Bull 5M 2X | SBIN | LONG | 812.30 | 824.50 | 28 | **+341.60** | Target Hit | 261125170125841 | 261125170205118 |
| **7** | `c001dea0-0001-4000-8000-000000000007` | 25 Nov 2026, 11:40 AM | Bear 5M 2X | BHARTIARTL | SHORT | 1,580.00 | 1,558.00 | 15 | **+330.00** | Target Hit | 261125170158223 | 261125170231994 |
| **8** | `c001dea0-0001-4000-8000-000000000008` | 26 Nov 2026, 09:22 AM | Bull 5M 2X | RELIANCE | LONG | 1,260.40 | 1,278.20 | 24 | **+427.20** | Target Hit | 261126170077890 | 261126170144901 |
| **9** | `c001dea0-0001-4000-8000-000000000009` | 26 Nov 2026, 10:00 AM | Bull 5M 2X | ICICIBANK | LONG | 1,270.00 | 1,284.50 | 18 | **+261.00** | Target Hit | 261126170098554 | 261126170174221 |
| **10** | `c001dea0-0001-4000-8000-000000000010` | 26 Nov 2026, 10:45 AM | Bear 5M 2X | ITC | SHORT | 472.00 | 465.50 | 38 | **+247.00** | Target Hit | 261126170128445 | 261126170206332 |
| **11** | `c001dea0-0001-4000-8000-000000000011` | 26 Nov 2026, 11:10 AM | Bear 5M 2X | TCS | SHORT | 4,142.34 | 4,100.00 | 5 | **+211.70** | Target Hit | 261126170146778 | 261126170233441 |

**Subtotal of Added P&L:** **₹3,338.30**

---

## 4. How to Delete / Rollback These Trades

Jab bhi aapko yeh 11 trades delete karni hon, aap inme se koi bhi ek method use kar sakte hain:

### Method 1: TypeScript / Script Execution (Recommended)
Local machine ya VPS par run karein:
```bash
npx tsx scripts/delete_kuldeep_winning_trades.ts
```

### Method 2: Direct SQL Query
Database / psql terminal ya Neon dashboard par run karein:
```sql
DELETE FROM "Trade" 
WHERE client_id = 'a6ad5d1d-1da9-40b9-b14d-72bc4f60e65c' 
  AND id LIKE 'c001dea0-%';
```

### Method 3: Re-seeding / Re-applying
Agar dubara add karna ho:
```bash
npx tsx scripts/seed_kuldeep_winning_trades.ts
```

---

## 5. Files Changed & Configuration

- `scripts/seed_kuldeep_winning_trades.ts` — Insertion script with all 11 trade records.
- `scripts/delete_kuldeep_winning_trades.ts` — 1-click clean deletion script.
- `src/shared/utils/temporaryOverrides.ts` — `KULDEEP_PNL_MULTIPLIER` reset to `1.0`.
- `docs/KULDEEP_CUSTOM_DATA.md` — This documentation file.
