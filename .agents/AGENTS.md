# Growffiy — Project Rules & AI Guidelines

## 🏗️ Project Overview

Growffiy is an algorithmic trading platform. It has two portals:
- **Admin Portal** (`/admin`) — Real strategy management, client management, live trading controls
- **Client Portal** (`/clients`) — Client-facing dashboard, demo strategy builder, reports

---

## ⚠️ Critical Rules for AI Code Assistants

### 1. Strategy Pages

| Page | Table | Status | Notes |
|------|-------|--------|-------|
| `/admin/strategies` | `strategies` | ✅ REAL / PRODUCTION | Admin strategy builder. Do NOT add broker/trading logic here. |
| `/clients/strategy` | `demo_stttgry` | ⚠️ DEMO ONLY | Client demo strategy page. No connection to live trading. |

### 2. Database Tables

| Table | Purpose | Connected to Trading? |
|-------|---------|----------------------|
| `strategies` | Admin-configured strategy templates | ❌ NO — UI/config only |
| `demo_stttgry` | Client-side demo strategies | ❌ NO — demo/display only |
| `trades` | Live trade records | ✅ YES — Do NOT modify structure carelessly |
| `clients` | Client profiles | ✅ YES — Connected to live trading system |

### 3. Demo Strategy System (`demo_stttgry`)

- The client strategy page (`/src/app/clients/strategy/page.tsx`) is **DEMO ONLY**
- It uses the `demo_stttgry` table in the database
- It has **NO connection** to:
  - Live trading engine or AlgoEngine
  - Broker APIs (Zerodha / Kite Connect)
  - Real order placement or execution
- Data is saved per-client in the DB for display purposes only
- **AI must NOT** add trading/broker logic to this page or table

### 4. Admin Strategy Page (`strategies` table)

- `/src/app/admin/strategies/page.tsx` is a **REAL production page**
- Strategies created here are stored in the `strategies` DB table
- **AI must NOT** connect this page directly to live broker order APIs
- **AI must NOT** modify this file when working on AlgoEngine internals

---

## 📁 Key File Locations

```
src/
├── app/
│   ├── admin/
│   │   └── strategies/page.tsx     ← ✅ Real admin strategy builder
│   ├── clients/
│   │   └── strategy/
│   │       ├── page.tsx            ← ⚠️ Demo only (demo_stttgry table)
│   │       └── add/page.tsx        ← ⚠️ Demo only
│   └── api/
│       ├── algo/                   ← ✅ AlgoEngine REST APIs (REAL trading)
│       └── clients/
│           └── demo-strategies/    ← ⚠️ Demo strategies CRUD (no trading)
├── engine/                         ← ✅ Core trading execution engine
└── shared/
    ├── components/sidebar/
    │   └── Sidebar.tsx             ← Navigation — Strategy menu visible only for algo product type clients
    └── viewmodels/
        └── AppContext.tsx          ← Global app state

prisma/
└── schema.prisma                   ← DB schema — check comments on each model
```

---

## 🔧 Sidebar — Strategy Menu Visibility

- The **Strategy** menu group in the client sidebar (`Sidebar.tsx`) is only shown for clients who have **`algo` product type**
- It is hidden for all other product types
- This was intentionally scoped — do NOT change this visibility logic without explicit approval

---

## 🗄️ Database Notes

- **DB**: Neon PostgreSQL (serverless)
- **ORM**: Prisma with `@prisma/adapter-neon`
- After adding new Prisma models, always run: `npx prisma generate && npx prisma db push`
- Seed scripts are in `/scripts/` — run with `npx tsx scripts/<filename>.ts`

---

## 🚫 Things AI Should NEVER Do

1. Connect `demo_stttgry` or `strategies` table to live order execution
2. Add broker API calls (Zerodha/Kite) to admin or client strategy pages
3. Modify `/src/engine/` files without explicit user instruction
4. Change the sidebar strategy menu visibility logic without approval
5. Use the `strategies` or `demo_stttgry` tables for real trading decisions

---

## 🖥️ Server Environments — STRICT RULES

### Server Overview

| Client | Environment | Server IP / Domain | Purpose |
|--------|-------------|-------------------|---------|
| **Janvi** | 🧪 TESTING | `growffi.com` (Hostinger) | Testing & verification only |
| **Ashutosh** | 🔴 PRODUCTION | `66.116.245.44` (`growffi.in`) | Live trading — real clients |
| **Anand Kumar Sharma** | 🔴 PRODUCTION | `66.116.210.206` (`growffi.live`) | Live trading — real clients |

### Rules

1. 🧪 **Janvi (`growffi.com`) = TESTING ONLY**
   - Sirf naye features, UI changes aur strategy configs yahan test karein
   - Koi bhi naya change pehle Janvi pe verify hoga

2. 🔴 **Ashutosh (`growffi.in`) & Anand (`growffi.live`) = PRODUCTION**
   - **AI must NEVER** make any change (code, config, DB query, deployment, SSH command) on these servers without **explicit user approval**
   - Production servers pe bina permission ke SSH, DB query, restart — kuch bhi NAHI
   - 🔐 **DOUBLE CONFIRMATION RULE (MANDATORY)**:
     - **Step 1:** AI must clearly state: *"Main [SERVER NAME / IP] pe ye change karne wala hoon: [EXACT CHANGE DESCRIPTION]"*
     - **Step 2:** User se **pehli baar permission** leni hai
     - **Step 3:** Confirmation milne ke baad **phir se ek baar clearly batao** kya execute hoga
     - **Step 4:** User se **doosri baar final approval** leni hai — tabhi execute karo
   - Koi bhi shortcut nahi — dono confirmations mandatory hain production servers ke liye

3. 🗄️ **New Server Deployment — Database Restore Rule**
   - Jab bhi **koi naya server setup karna ho**, database seed ya fresh migration **mat karo**
   - **HAMESHA** `database/janvi_db_backup.sql` use karo — yahi **master backup** hai
   - Restore command:
     ```bash
     psql <NEW_DB_CONNECTION_URL> < database/janvi_db_backup.sql
     ```
   - 🚫 **Kabhi bhi `npx prisma db seed` ya koi seed script mat chalao** jab tak user explicitly na bole
