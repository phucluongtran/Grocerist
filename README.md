# Grocerist

Grocery store management app — Dashboard, Inventory, Sales & Forecasting, Customers.

## Stack
- **Frontend**: React + Vite + Tailwind CSS + Recharts
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (4-schema architecture)
- **Auth**: JWT (owner / staff roles)

---

## Database Architecture

The database uses a layered 4-schema design:

| Schema | Purpose |
|--------|---------|
| `app` | Operational tables — source of truth for all live data |
| `stg` | Staging layer — raw copies loaded from `app` before warehouse processing |
| `wh` | Data warehouse — dimension and fact tables for analytics |
| `marts` | Aggregated reporting tables for fast dashboard queries |

### app schema tables
- `app.users` — store accounts (owner / staff roles)
- `app.products` — product catalog with `cost`, `price`, `low_stock_threshold`
- `app.inventory` — stock levels per product (`stock`, `last_updated`)
- `app.sales` — sales transactions with optional `customer_id` and `created_by`
- `app.customers` — customer records with `loyalty_points`

### wh schema tables
- `wh.dim_products`, `wh.dim_customers`, `wh.dim_date` — dimension tables
- `wh.fact_sales` — fact table with `revenue` and `profit` columns

### marts schema tables
- `marts.daily_sales_summary` — daily aggregates (orders, items, revenue)
- `marts.product_performance` — per-product units sold, revenue, last sale date

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
npm run migrate      # runs all 3 migration files in order
npm run dev          # starts on :4000
```

### 3. Create your first user (owner)

```bash
curl -X POST http://localhost:4000/api/auth/seed \
  -H "Content-Type: application/json" \
  -d '{"name":"Store Owner","email":"owner@store.com","password":"yourpassword","role":"owner"}'
```

To create a staff account:
```bash
curl -X POST http://localhost:4000/api/auth/seed \
  -H "Content-Type: application/json" \
  -d '{"name":"Staff Name","email":"staff@store.com","password":"yourpassword","role":"staff"}'
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

## ETL Refresh

Trigger a full warehouse refresh (owner only):

```bash
curl -X POST http://localhost:4000/api/etl/refresh \
  -H "Authorization: Bearer <token>"
```

This runs a single transaction that:
1. Truncates and reloads `stg.*` from `app.*`
2. Rebuilds `wh.dim_*` and `wh.fact_sales` (with `revenue` and `profit`)
3. Rebuilds `marts.daily_sales_summary` and `marts.product_performance`

---

## Pages

| Page | Path | Description |
|------|------|-------------|
| Dashboard | `/` | Low-stock alerts, today's sales snapshot |
| Inventory | `/inventory` | Products table with cost/threshold, stock editing |
| Sales & Forecasting | `/sales` | Revenue chart, record sales, 7-day demand forecast |
| Customers | `/customers` | Customer list with loyalty points |

## Role Permissions

| Feature | Owner | Staff |
|---------|-------|-------|
| View all pages | ✓ | ✓ |
| Add/edit/delete products | ✓ | — |
| Edit inventory stock | ✓ | ✓ |
| Record / delete sales | ✓ | ✓ |
| Add/edit/delete customers | ✓ | ✓ |
| Trigger ETL refresh | ✓ | — |
