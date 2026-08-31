# Growffiy Client Deployment & Server Management Guide

Iss document mein har client setup, unke server infrastructure, database, aur deployment/update process ki details hai.

---

## 📌 Overview Table

| Client Name | Environment | Hosting Type / Provider | Server IP / Domain | SSH User & Pass / Access | Database Type / Connection URL | Code Path / Location | Update Method |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Anand** | 🧪 **TESTING** | Hostinger | Web Hosting (`growffi.live`) | Panel Access (File Manager) | Neon Cloud PostgreSQL (`postgresql://neondb_owner:...`) | `/public_html` | ZIP Upload / Web Portal |
| **Ashutosh** (⚠️ **SUSPENDED ACCOUNT/SERVER**) | 🔴 **PRODUCTION** | GlobeHost VPS | `66.116.245.44` (`growffi.in`) | `root` / `2hA@QAydr#r%pD` | Local VPS PostgreSQL (`postgresql://growffiy:...`) | `/var/www/growffiy` | SSH Script / Commands |
| **Janvi** | 🔴 **PRODUCTION** | VPS | `66.116.210.206` (`growffi.com`) | `root` / `Q}K)H~l8i@=XwC` | Local VPS PostgreSQL (`postgresql://growffiy_user:growffiy_live_pass_2026@localhost:5432/growffiy_com_db`) | `/var/www/growffiy` | SSH Script / Commands |

---

## ⚠️ Critical Rules for AI & Developers

1. 🧪 **Anand Server (`growffi.live`) = TESTING ENVIRONMENT**
   - Ye server sirf **Testing & Verification** ke liye hai.
   - Naye UI changes, strategy configurations, aur features pehle yahan test aur verify honge.

2. 🔴 **Ashutosh (`growffi.in`) & Janvi (`growffi.com`) = PRODUCTION ENVIRONMENTS**
   - Ye servers **REAL LIVE TRADING / PRODUCTION** ke liye hain.
   - 🚫 **STRICT RULE:** Production servers (66.116.245.44 aur 66.116.210.206) ke code, configuration, ya database (DB) me **bina explicit user instruction/approval ke koi bhi change, deployment, ya query execute NAHI karni hai**.
   - Production server pe modification sirf tabhi hoga jab User explicitly specific approval de.
   - 🔐 **DOUBLE CONFIRMATION MANDATORY** — Production pe kuch bhi karne se pehle:
     - **Pehle:** AI clearly batayega: *"Main [SERVER NAME/IP] pe ye karne wala hoon: [EXACT DESCRIPTION]"*
     - **Pehli Permission lo** — User se confirm karo
     - **Phir se clearly batao** — exactly kya command/change execute hoga
     - **Doosri Final Permission lo** — tabhi execute karo
   - Koi bhi shortcut ya assumption nahi — dono approvals mandatory hain

3. 🗄️ **New Server Deployment — Database Restore**
   - Jab bhi **koi naya server setup karna ho**, toh database seed ya fresh migration **mat karo**.
   - **HAMESHA** `database/janvi_db_backup.sql` file use karo — yahi **master backup hai jo Anand ke current DB ka full snapshot hai**.
   - Iss file ko restore karke naye server ka DB setup hoga:
     ```bash
     # Naye server pe DB restore karne ka command:
     psql <NEW_DB_CONNECTION_URL> < database/janvi_db_backup.sql
     ```
   - 🚫 **Kabhi bhi `npx prisma db seed` ya koi aur seed script mat chalao** jab tak user explicitly na bole.

---

## 1. 🟢 Client 1: Anand Setup

### ⚙️ Details & Architecture
- **Domain**: `growffi.live`
- **Hosting**: Hostinger
- **Database**: Neon PostgreSQL (`serverless`)
- **Database URL**: `postgresql://neondb_owner:npg_Qtok2RmWK4uT@ep-purple-frost-aimotyfv-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
- **Deployment Type**: Manual Zip Update
- **🗄️ DB Backup Location**: `database/janvi_db_backup.sql` *(Full DB snapshot — use this for any new server restore)*

### 🚀 Update & Deployment Procedure
1. Local codebase update karein aur clean build verify karein:
   ```bash
   npm run build
   ```
2. Build output (`.next` ya export build) aur required configuration files (`package.json`, `prisma`, etc.) ka `.zip` archive banayein.
3. Hostinger File Manager / Panel mein jaakar puraane code/zip ko replace karein.
4. Agar DB Schema change hua hai toh Neon DB connection URL ke saath Prisma push run karein:
   ```bash
   npx prisma db push
   ```

---

## 2. 🔵 Client 2: Ashutosh Setup (⚠️ **SUSPENDED ACCOUNT/SERVER**)

### ⚙️ Details & Credentials
- **Domain**: `growffi.in`
- **Hosting Provider**: GlobeHost VPS
- **Server IP**: `66.116.245.44`
- **User**: `root`
- **Password**: `2hA@QAydr#r%pD` *(⚠️ Sensitive: Securely handle credentials)*
- **Database**: Local VPS PostgreSQL (`growffiy_db`)
- **Database URL**: `postgresql://growffiy:growffiy123@127.0.0.1:5432/growffiy_db?sslmode=disable`

### 🚀 Update & Deployment Procedure

#### SSH Access Command:
Direct SSH login ke liye command:
```bash
sshpass -p '2hA@QAydr#r%pD' ssh root@66.116.245.44
```

#### Automated / Remote Commands via SSH:
1. **Server Login & Code Pull/Update**:
   ```bash
   sshpass -p '2hA@QAydr#r%pD' ssh root@66.116.245.44 "cd /path/to/project && git pull origin main"
   ```
2. **Dependencies & Build**:
   ```bash
   sshpass -p '2hA@QAydr#r%pD' ssh root@66.116.245.44 "cd /path/to/project && npm install && npm run build"
   ```
3. **Database Migration / Schema Push**:
   ```bash
   sshpass -p '2hA@QAydr#r%pD' ssh root@66.116.245.44 "cd /path/to/project && npx prisma db push"
   ```
4. **PM2 / Service Restart**:
   ```bash
   sshpass -p '2hA@QAydr#r%pD' ssh root@66.116.245.44 "pm2 restart all"
   ```

---

## 3. 🟣 Client 3: Janvi Setup (growffi.com)

### ⚙️ Details & Credentials
- **Client Name**: Janvi
- **Domain**: `growffi.com`
- **Server IP**: `66.116.210.206`
- **SSH Port**: `22`
- **User**: `root`
- **Password**: `Q}K)H~l8i@=XwC` *(⚠️ Sensitive)*
- **Demat Details**: User ID: `UTE055` | Password: `12345678`
- **Database**: Local VPS PostgreSQL (`growffiy_com_db` - Restored Neon Master backup copy)

### 🚀 Fresh Deployment & Clean DB Setup Steps

#### SSH Login Command:
```bash
sshpass -p 'Q}K)H~l8i@=XwC' ssh root@66.116.210.206
```

#### Fresh Database Setup (Clean DB without old clients or trade history):
Naye server pe clean schema push karne ke liye (seed data/old clients mat run karna):
1. **DB Clean Schema Push**:
   ```bash
   sshpass -p 'Q}K)H~l8i@=XwC' ssh root@66.116.210.206 "cd /path/to/project && npx prisma db push --skip-generate"
   ```
   *(Note: Do **NOT** run `npx prisma db seed` agar client ya trade data nahi chahiye).*

2. **Deploy / Update Code**:
   ```bash
   sshpass -p 'Q}K)H~l8i@=XwC' ssh root@66.116.210.206 "cd /var/www/growffiy && git pull origin main && npm install && npm run build && pm2 restart growffiy"
   ```

3. **Stock Scanner (Python) Update / Restart**:
   Python dependencies sync aur daemon process start/restart ke liye commands:
   ```bash
   # Dependencies installation
   sshpass -p 'Q}K)H~l8i@=XwC' ssh root@66.116.210.206 "cd /var/www/growffiy/stock-scanner && pip3 install -r requirements.txt psycopg2-binary"

   # Start stock-scanner service (First time only)
   sshpass -p 'Q}K)H~l8i@=XwC' ssh root@66.116.210.206 "pm2 start \"python3 /var/www/growffiy/stock-scanner/src/kite_to_gspread.py\" --name stock-scanner"

   # Restart stock-scanner service
   sshpass -p 'Q}K)H~l8i@=XwC' ssh root@66.116.210.206 "pm2 restart stock-scanner"
   ```

---

## 📋 New Client Onboarding Checklist

Jab bhi koi naya client aaye, is format ke anusar details add karein:
- [ ] Server Hosting Provider select karein (Hostinger / VPS / Other)
- [ ] Database create karein (Neon PostgreSQL / VPS DB)
- [ ] Deployment Script / Access Credentials document karein
- [ ] Environment variables (`.env`) properly configure karein

