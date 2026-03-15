# Grocerist v2

Grocery store management app — Dashboard, Inventory, Sales & Forecasting, Customers & Promotions.

## Stack
- **Frontend**: React + Vite + Tailwind CSS + Recharts
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL
- **Auth**: JWT (owner / staff roles)

---

## Setup

### 1. PostgreSQL database

Create a database named `grocerist`:
```bash
createdb grocerist
```

### 2. Server

```bash
cd server
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET
npm install
npm run migrate      # creates all tables
npm run dev          # starts on :4000
```

### 3. Create your first user (owner)

```bash
curl -X POST http://localhost:4000/api/auth/seed \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@store.com","password":"yourpassword","role":"owner"}'
```

To create a staff account:
```bash
curl -X POST http://localhost:4000/api/auth/seed \
  -H "Content-Type: application/json" \
  -d '{"email":"staff@store.com","password":"yourpassword","role":"staff"}'
```

> In production, set `SEED_SECRET` in `.env` and pass `"secret":"..."` in the body.

### 4. Client

```bash
cd client
npm install
npm run dev          # starts on :5173
```

Open http://localhost:5173 and log in.

---

## Pages

| Page | Path | Description |
|------|------|-------------|
| Dashboard | `/` | Alerts, today's sales snapshot, daily to-do list |
| Inventory | `/inventory` | Products table, stock editing, pricing suggestions |
| Sales & Forecasting | `/sales` | Revenue chart, record sales, 7-day demand forecast |
| Customers & Promotions | `/customers` | Customer list, promotion composer |

## Role Permissions

| Feature | Owner | Staff |
|---------|-------|-------|
| View all pages | ✓ | ✓ |
| Add/edit/delete products | ✓ | — |
| Edit inventory quantities | ✓ | ✓ |
| Record / delete sales | ✓ | ✓ |
| Add/edit/delete customers | ✓ | ✓ |
| Create/delete promotions | ✓ | — |
