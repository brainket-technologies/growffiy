# Growffiy Client Deployment & Server Management Guide

Iss document mein har client setup, unke server infrastructure, database, aur deployment/update process ki details hai.

---

## 📌 Overview Table

| Client Name | Hosting Type / Provider | Server IP / Domain | SSH User & Pass / Access | Database Type / Connection URL | Code Path / Location | Update Method |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Janvi** | Hostinger | Web Hosting | Panel Access (File Manager) | Neon Cloud PostgreSQL (`postgresql://neondb_owner:npg_Qtok2RmWK4uT@ep-purple-frost-aimotyfv-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require`) | `/public_html` | ZIP Upload / Web Portal |
| **Ashutosh** | GlobeHost VPS | `66.116.245.44` (`growffi.in`) | `root` / `2hA@QAydr#r%pD` | Local VPS PostgreSQL (`postgresql://growffiy:growffiy123@127.0.0.1:5432/growffiy_db`) | `/var/www/growffiy` | SSH Script / Commands |
| **Anand Kumar Sharma** | VPS | `66.116.210.206` (`growffi.live`) | `root` / `Q}K)H~l8i@=XwC` | Local VPS PostgreSQL (`postgresql://growffiy_user:AnandSecureDBPass2026%21@127.0.0.1:5432/growffiy_anand_db`) | `/var/www/growffiy` | SSH Script / Commands |

---

## 1. 🟢 Client 1: Janvi Setup

### ⚙️ Details & Architecture
- **Hosting**: Hostinger
- **Database**: Neon PostgreSQL (`serverless`)
- **Database URL**: `postgresql://neondb_owner:npg_Qtok2RmWK4uT@ep-purple-frost-aimotyfv-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
- **Deployment Type**: Manual Zip Update

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

## 2. 🔵 Client 2: Ashutosh Setup

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

## 3. 🟣 Client 3: Anand Kumar Sharma Setup (growffi.live)

### ⚙️ Details & Credentials
- **Client Name**: Anand Kumar Sharma
- **Domain**: `growffi.live`
- **Server IP**: `66.116.210.206`
- **SSH Port**: `22`
- **User**: `root`
- **Password**: `Q}K)H~l8i@=XwC` *(⚠️ Sensitive)*
- **Demat Details**: User ID: `UTE055` | Password: `12345678`
- **Database**: Fresh Local VPS PostgreSQL (Zero old clients/trades)

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
   sshpass -p 'Q}K)H~l8i@=XwC' ssh root@66.116.210.206 "cd /path/to/project && git pull origin main && npm install && npm run build && pm2 restart all"
   ```

---

## 📋 New Client Onboarding Checklist

Jab bhi koi naya client aaye, is format ke anusar details add karein:
- [ ] Server Hosting Provider select karein (Hostinger / VPS / Other)
- [ ] Database create karein (Neon PostgreSQL / VPS DB)
- [ ] Deployment Script / Access Credentials document karein
- [ ] Environment variables (`.env`) properly configure karein

