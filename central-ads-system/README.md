# 🚀 Central Ads System

> Mini Google Ads / Ad Network — Production-ready microservices built with **Bun + Elysia + Drizzle ORM + SQLite**

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT / CURL                         │
└─────────────────────────┬───────────────────────────────┘
                          │ :3000
                    ┌─────▼──────┐
                    │  GATEWAY   │  ← single entry point
                    └─────┬──────┘
          ┌───────────────┼───────────────┐
          │               │               │
    :3002 ▼         :3001 ▼         :3003 ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│company-svc   │ │  ads-svc     │ │ payment-svc  │
│ auth/register│ │  /ads        │ │ /topup       │
│ auth/login   │ │  /library    │ │ /balance     │
│ /company     │ │  /events     │ │ /transactions│
└──────────────┘ └──────────────┘ └──────────────┘
                          │
                    ┌─────▼──────┐
                    │   ENGINE   │  ← background loop (no port)
                    │  (cron)    │  checks balance every Xs
                    └────────────┘
                          │
                    ┌─────▼──────┐
                    │  SQLite DB │  ← shared central-ads.db
                    └────────────┘
```

### Services & Ports

| Service          | Port  | Responsibility                          |
|-----------------|-------|-----------------------------------------|
| `gateway`        | 3000  | Central proxy — single entry for clients|
| `ads-service`    | 3001  | CRUD ads, libraries, event tracking     |
| `company-service`| 3002  | Auth (register/login), company CRUD     |
| `payment-service`| 3003  | Balance topup, transaction history      |
| `main-engine`    | —     | Background loop — activate/deactivate ads |

---

## ⚡ Quick Start

### 1. Prerequisites

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Verify
bun --version  # >= 1.1.0
```

### 2. Install & Setup

```bash
git clone <repo>
cd central-ads-system

# Install dependencies
bun install

# Copy env config
cp .env.example .env

# Create DB + tables
bun run db:migrate

# (Optional) seed demo data
bun run db:seed
```

### 3. Start Services

```bash
# Start ALL services at once (recommended)
bun run dev:all

# OR start individually (each in its own terminal)
bun run dev:company   # terminal 1 — :3002
bun run dev:ads       # terminal 2 — :3001
bun run dev:payment   # terminal 3 — :3003
bun run dev:engine    # terminal 4 — background loop
bun run dev:gateway   # terminal 5 — :3000 (main entry)
```

---

## 🧪 Full CLI Testing Flow (Step by Step)

> All commands go through the **gateway on port 3000**

### Step 1 — Register & Login

```bash
# Register a new user
curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@test.com","password":"password123","name":"Your Name"}' | jq

# Login → save token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@test.com","password":"password123"}' \
  | jq -r '.data.token')

echo "Token: $TOKEN"
```

### Step 2 — Create a Company

```bash
curl -s -X POST http://localhost:3000/company \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Startup","website":"https://mystartup.dev","industry":"Technology"}' | jq

# Get your companies
curl -s http://localhost:3000/company \
  -H "Authorization: Bearer $TOKEN" | jq

# Save company id
COMPANY_ID=$(curl -s http://localhost:3000/company \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data[0].id')
```

### Step 3 — Create Ads

```bash
# Create first ad
curl -s -X POST http://localhost:3000/ads \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Buy My SaaS Tool\",
    \"description\": \"Best project management for devs\",
    \"bannerUrl\": \"https://placehold.co/728x90\",
    \"type\": \"banner\",
    \"category\": \"tech\",
    \"companyId\": \"$COMPANY_ID\"
  }" | jq

# Create second ad
curl -s -X POST http://localhost:3000/ads \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Learn TypeScript Fast",
    "description": "Zero to hero in 30 days",
    "type": "native",
    "category": "education"
  }' | jq

# View your ads (will be inactive — no balance yet)
curl -s http://localhost:3000/ads/mine \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Step 4 — Create a Library

```bash
# Create library matching your ad type+category
curl -s -X POST http://localhost:3000/library \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Tech Blog Sidebar","type":"banner","category":"tech"}' | jq

# Save library id
LIBRARY_ID=$(curl -s -X POST http://localhost:3000/library \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Tech Blog Sidebar 2","type":"banner","category":"tech"}' \
  | jq -r '.data.id')

echo "Library ID: $LIBRARY_ID"

# Fetch ads by library (empty — ads inactive)
curl -s http://localhost:3000/library/$LIBRARY_ID/ads | jq
```

### Step 5 — Add Balance (Mock Payment)

```bash
# Option A: via API (with token)
curl -s -X POST http://localhost:3000/payment/topup \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 5.00, "note": "First topup"}' | jq

# Option B: via CLI script (needs userId)
USER_ID=$(curl -s http://localhost:3000/company/me \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data.id')

bun run payment:topup --userId=$USER_ID --amount=5

# Check balance
curl -s http://localhost:3000/payment/balance \
  -H "Authorization: Bearer $TOKEN" | jq

# View transactions
curl -s http://localhost:3000/payment/transactions \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Step 6 — Engine Activates Ads Automatically

```bash
# Watch engine terminal — you'll see:
# [ENGINE] ✅ User xxx@test.com — 2 ad(s) ACTIVATED (balance: $5.00)

# Now check ads — should be active!
curl -s http://localhost:3000/ads/mine \
  -H "Authorization: Bearer $TOKEN" | jq

# Fetch active ads via library (now populated!)
curl -s http://localhost:3000/library/$LIBRARY_ID/ads | jq
```

### Step 7 — Client-Side Ad Loading (createAds SDK)

```bash
# Simulates publisher loading ads, recording views + clicks
bun run src/scripts/createAds.ts --libraryId=$LIBRARY_ID
```

Output:
```
🚀 ADS ENGINE CLIENT
Library: lib-xxx
Fetching ads from http://localhost:3001...

✅  Found 1 active ad(s):

┌─ AD #1 ────────────────────────────────────────────
│ Buy My SaaS Tool
│ Best project management for devs
│ 🖼  https://placehold.co/728x90
│ Type: banner  Category: tech  Views: 0  Clicks: 0
└────────────────────────────────────────────────────

📊 Sending view events...
✅  Views recorded for 1 ad(s)
🖱  Simulating click on: "Buy My SaaS Tool"
✅  Click recorded
```

### Step 8 — Check Ad Stats

```bash
AD_ID=$(curl -s http://localhost:3000/ads/mine \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data[0].id')

curl -s http://localhost:3000/ads/$AD_ID/stats \
  -H "Authorization: Bearer $TOKEN" | jq
# → { views: 1, clicks: 1, ctr: "100.00%" }
```

### Step 9 — Test Low Balance Deactivation

```bash
# Drain balance to 0 (direct DB — for testing)
sqlite3 central-ads.db "UPDATE users SET balance = 0.50 WHERE email = 'you@test.com';"

# Watch engine terminal — within ENGINE_CHECK_INTERVAL you'll see:
# [ENGINE] 🔴 User xxx — 2 ad(s) DEACTIVATED (balance: $0.50 < $1)

# Ads are now inactive again
curl -s http://localhost:3000/ads/mine \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## 💳 Payment

### Mock Mode (default)

No Stripe account needed. Set in `.env`:
```
STRIPE_MOCK_MODE=true
```

### Real Stripe

```env
STRIPE_MOCK_MODE=false
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
```

```bash
bun add stripe
```

---

## 📁 Project Structure

```
central-ads-system/
├── .env.example
├── drizzle.config.ts
├── package.json
├── scripts/
│   └── start-all.ts          # parallel service launcher
└── src/
    ├── ads-service/
    │   ├── main.ts            # :3001
    │   ├── routes/index.ts
    │   ├── services/index.ts
    │   └── schemas/index.ts
    ├── company-service/
    │   ├── main.ts            # :3002
    │   ├── routes/index.ts
    │   ├── services/index.ts
    │   └── schemas/index.ts
    ├── payment-service/
    │   ├── main.ts            # :3003
    │   ├── routes/index.ts
    │   ├── services/index.ts
    │   └── schemas/index.ts
    ├── main-engine/
    │   └── main.ts            # background loop
    ├── gateway/
    │   └── main.ts            # :3000
    ├── db/
    │   ├── index.ts           # Drizzle connection
    │   ├── schema.ts          # all tables
    │   ├── migrate.ts         # bun run db:migrate
    │   └── seed.ts            # bun run db:seed
    ├── middlewares/
    │   ├── auth.ts            # JWT plugin + requireAuth
    │   └── errorHandler.ts   # global error handler
    ├── utils/
    │   ├── logger.ts          # colored service logger
    │   ├── response.ts        # ok() / fail() helpers
    │   └── id.ts              # uid()
    └── scripts/
        ├── topup.ts           # bun run payment:topup
        └── createAds.ts       # bun run src/scripts/createAds.ts
```

---

## 🗄️ Database Schema

| Table           | Key Fields                                            |
|----------------|-------------------------------------------------------|
| `users`         | id, email, password, name, **balance**               |
| `companies`     | id, userId, name, website, industry                  |
| `ads`           | id, userId, companyId, title, type, category, **status**, views, clicks |
| `libraries`     | id, userId, name, **type**, **category**             |
| `transactions`  | id, userId, amount, provider, status                 |
| `ad_events`     | id, adId, libraryId, event (view/click)              |
| `engine_logs`   | id, action, userId, details                          |

---

## ⚙️ Engine Logic

```
Every ENGINE_CHECK_INTERVAL ms:
  for each user:
    if balance >= $1.00:
      → activate all their inactive ads
      → log: "User X — N ads ACTIVATED"
    else:
      → deactivate all their active ads
      → log: "User X — N ads DEACTIVATED (low balance)"
```

---

## 🔐 Auth Flow

```
POST /auth/register  →  creates user
POST /auth/login     →  returns JWT token
Bearer <token>       →  required on protected routes
```

No cookies. Token-only. Middleware validates on every protected request.

---

## 🔥 What This Can Become

- Add bidding/auction system → real-time ad pricing
- Add impression-based billing → deduct from balance per 1000 views
- Add targeting (geo, device, time-of-day)
- Add WebSocket → real-time stats dashboard
- Add Web3 billing layer → pay per impression with crypto
