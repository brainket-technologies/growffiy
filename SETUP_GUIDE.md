# Growffiy Setup and Operations Guide

This guide covers complete codebase setup, environment variables, database migration, seeding operations, and login details.

## 1. Local Environment Setup

To run Growffiy locally, ensure you have Node.js (version 22+) installed.

### Dependencies Installation
Run the following command to install the required packages:
```bash
npm install
```

### Environment Variables Configuration
Create a `.env` file in the root directory and define the Neon PostgreSQL database connections:
```ini
# Pooled connection (used by Next.js App Router and API routes via @prisma/adapter-neon)
DATABASE_URL="postgresql://neondb_owner:npg_Qtok2RmWK4uT@ep-purple-frost-aimotyfv-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Direct connection (used by Prisma CLI for migrations and schema introspection)
DIRECT_URL="postgresql://neondb_owner:npg_Qtok2RmWK4uT@ep-purple-frost-aimotyfv.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

---

## 2. Database Migrations & Seeding

All tables are managed via Prisma. You can perform migrations and seed the initial setup (admin details, default strategies, subscription plans) with simple commands.

### Apply Database Migrations
To push the schema structure to the live database, run:
```bash
npx prisma db push
```

### Seed Seed Data
To populate the database tables with default configuration data (such as the admin credentials and standard plans), execute:
```bash
npx prisma db seed
```

---

## 3. Login Details

Use these pre-seeded credentials to access the panels:

### Client Panel Login
- **URL**: `https://growffiy.vercel.app/login` (or `http://localhost:3000/login` locally)
- **Pre-seeded User ID**: `aman_sharma`
- **Pre-seeded Password**: `123` *(Remember to toggle the "Remember Me" checkbox to keep your session active!)*

### Admin Console Login
- **URL**: `https://growffiy.vercel.app/admin/login` (or `http://localhost:3000/admin/login` locally)
- **Admin Email**: `firoz@gmail.com`
- **Admin Password**: `12345` *(database updated/synced)*

---

## 4. Run Development Server

To start the local Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.
