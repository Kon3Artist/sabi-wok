# Sabi Wok — Quick Start Guide

## Project location
`C:\Users\S&H ENG-8\Documents\sabi-wok`

## Step 1 — Set up Supabase (free database)
1. Go to **supabase.com** → Sign up → New Project
2. Give it a name (e.g. "sabi-wok"), set a strong password, pick a region (closest to Sierra Leone = **Europe West**)
3. Wait ~2 minutes for it to provision
4. Go to **Settings → Database → Connection string**
   - Copy the **URI** (Transaction mode / pgBouncer) → paste as `DATABASE_URL` in `.env.local`
   - Copy the **Direct connection** URI → paste as `DIRECT_URL` in `.env.local`
   - Replace `[YOUR-PASSWORD]` in both with your project password
5. Go to **Settings → API**
   - Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

## Step 2 — Generate NextAuth secret
Open a terminal in the project folder and run:
```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output → paste as `NEXTAUTH_SECRET` in `.env.local`

## Step 3 — Set up Paystack (payments)
1. Go to **dashboard.paystack.com** → Sign up (use Sierra Leone / Nigeria)
2. Settings → API Keys & Webhooks
   - Copy **Secret key** → `PAYSTACK_SECRET_KEY`
   - Copy **Public key** → `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
3. For now use the **test keys** (start with `sk_test_` and `pk_test_`)

## Step 4 — Set up Pusher (real-time)
1. Go to **pusher.com** → Sign up → Create App
2. Name: "sabi-wok", Cluster: **mt1** (Middle East / Africa)
3. App Keys tab → copy all 4 values into `.env.local`

## Step 5 — Push database & seed
```
npm run db:push    # creates all tables in Supabase
npm run db:seed    # adds categories, skills, platform settings
```

## Step 6 — Run the app
```
npm run dev
```
Open **http://localhost:3000**

## First login as Admin
1. Register a normal account on the site
2. In Supabase → Table Editor → users table
3. Find your row → change `role` to `ADMIN` → Save
4. Refresh the site — you now have the Admin panel at `/admin`
