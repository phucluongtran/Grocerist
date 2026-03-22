# Grocerist

> A full-stack grocery store management dashboard for inventory, sales, forecasting, and customer management.

![Node.js](https://img.shields.io/badge/Node.js-Express-green) ![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue) ![Deployed on Railway](https://img.shields.io/badge/backend-Railway-purple) ![Deployed on Vercel](https://img.shields.io/badge/frontend-Vercel-black)

## Overview

Grocerist is a business operations platform built for small to mid-size grocery stores. It replaces spreadsheets with a real-time dashboard covering stock tracking, point-of-sale, customer loyalty, demand forecasting, and analytics reporting — all accessible through a clean web interface.

The system implements a layered data architecture (operational → staging → warehouse → marts) that separates day-to-day transactional data from reporting aggregates. Store owners get rich analytics while staff handle daily operations without touching sensitive configuration.

Access is role-gated: **owners** can manage products, import data, and trigger ETL refreshes; **staff** can record sales, update stock, and manage customers.

## Features

- **Dashboard** — Live snapshot of today's revenue, units sold, top 3 products, low-stock alerts, and a 7-day revenue trend chart
- **Point of Sale** — Searchable product grid with a shopping cart; checkout atomically records all sales and decrements stock
- **Inventory Management** — Table view of stock levels with inline editing and low-stock threshold indicators
- **Product Catalog** — Full CRUD for products (owner only) including SKU, category, price, and cost
- **Customer Management** — Customer records with loyalty points tracking
- **Demand Forecasting** — 28-day sales history + 7-day ahead forecast per product using a simple moving average
- **Reports** — Revenue charts by time range (7 / 30 / 90 days) and top-products breakdown
- **CSV Import** — Bulk import products, inventory, customers, and sales from CSV files with flexible column matching
- **ETL Refresh** — One-click warehouse rebuild: staging → dimensions + facts → reporting marts in a single transaction
- **Role-Based Access Control** — Owner and staff roles enforced at the route level

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend framework | React | 19.2.4 |
| Build tool | Vite | 8.0.0 |
| Frontend language | TypeScript | ~5.9.3 |
| Styling | Tailwind CSS | 4.2.1 |
| Router | React Router DOM | 7.13.1 |
| HTTP client | Axios | 1.13.6 |
| Charts | Recharts | 3.8.0 |
| Icons | Lucide React | 0.577.0 |
| Backend runtime | Node.js + Express | Express 4.19.2 |
| Backend language | TypeScript | 5.4.5 |
| Database | PostgreSQL | pg 8.12.0 |
| Authentication | JSON Web Tokens | jsonwebtoken 9.0.2 |
| Password hashing | bcryptjs | 2.4.3 |
| File upload / CSV | multer + csv-parse | 2.1.1 / 6.1.0 |
| Frontend hosting | Vercel | — |
| Backend hosting | Railway | — |

## Architecture

```
Grocerist/
├── client/                  React + Vite frontend
│   ├── src/
│   │   ├── main.tsx         App bootstrap
│   │   ├── App.tsx          Route definitions
│   │   ├── context/         AuthContext (global user state)
│   │   ├── hooks/           useAuth (login, logout, token verify)
│   │   ├── lib/             Axios instance, utility helpers
│   │   ├── components/      ProtectedRoute, Sidebar layout
│   │   └── pages/           Login, Dashboard, Sales, Inventory,
│   │                        Products, Customers, Reports, Settings
│   └── vercel.json          SPA routing + API proxy to Railway
│
├── server/                  Express + TypeScript API
│   └── src/
│       ├── index.ts         Server setup, route registration, migrations
│       ├── db/
│       │   ├── pool.ts      PostgreSQL connection pool
│       │   ├── migrate.ts   Migration runner (idempotent)
│       │   └── migrations/
│       │       └── 001_init.sql  Full 4-schema DB setup
│       ├── middleware/      JWT auth, role guard, error handler
│       └── routes/          auth, products, inventory, sales,
│                            customers, forecast, alerts, import, etl
│
└── sample-data/             Example CSV files for seeding
```

### Database Architecture

The schema uses four layers to separate operational from analytical concerns:

| Schema | Purpose | Key Tables |
|---|---|---|
| `app` | Operational source of truth | users, products, customers, inventory, sales |
| `stg` | Staging (raw copies for ETL) | sales, products, customers |
| `wh` | Data warehouse | dim_products, dim_customers, dim_date, fact_sales |
| `marts` | Aggregated reporting | daily_sales_summary, product_performance |

The `/api/etl/refresh` endpoint runs a single atomic transaction that rebuilds `stg` → `wh` → `marts` from the current `app` data.

### Request Flow

```
Browser → Vercel Edge (/api/*) → Railway Express → PostgreSQL
                     ↓
              All other paths → /index.html (SPA)
```

In local development, Vite's dev server proxies `/api` to `http://localhost:4000`.

## Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later
- **PostgreSQL** 14 or later (local instance or cloud-hosted)

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/tranphucluong/Grocerist.git
cd Grocerist

# 2. Install all dependencies (server + client)
npm run install:all

# 3. Configure the server environment
cp server/.env.example server/.env
# Edit server/.env — set DATABASE_URL and JWT_SECRET at minimum

# 4. Create the database
createdb grocerist

# 5. Run the database migration
npm run migrate
```

## Usage

```bash
# Terminal 1 — start the API server (http://localhost:4000)
npm run dev:server

# Terminal 2 — start the frontend (http://localhost:5173)
npm run dev:client
```

Open `http://localhost:5173` and log in.

### Creating the first user

There is no default user. Use the seed endpoint to create an owner account:

```bash
# Development (no secret required)
curl -X POST http://localhost:4000/api/auth/seed \
  -H "Content-Type: application/json" \
  -d '{"name":"Store Owner","email":"owner@store.com","password":"yourpassword","role":"owner"}'

# Staff account
curl -X POST http://localhost:4000/api/auth/seed \
  -H "Content-Type: application/json" \
  -d '{"name":"Staff Name","email":"staff@store.com","password":"yourpassword","role":"staff"}'
```

In production, set `SEED_SECRET` in `.env` and include `"seedSecret": "..."` in the request body.

### Importing sample data

CSV files in `/sample-data/` can be uploaded through the Settings page (owner only) to populate products, inventory, customers, and historical sales.

## Configuration

### Server environment variables (`server/.env`)

| Variable | Required | Description | Default |
|---|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (public) | — |
| `DATABASE_PRIVATE_URL` | No | Internal connection string (Railway private network, no SSL) | — |
| `JWT_SECRET` | Yes | Secret key for signing JWT tokens | — |
| `PORT` | No | Port the API server listens on | `4000` |
| `CLIENT_URL` | No | Allowed CORS origin | `*` |
| `SEED_SECRET` | No | Required in production to call `/api/auth/seed` | — |

**Database connection priority:** `DATABASE_PRIVATE_URL` is used when present (Railway internal, no SSL). Otherwise `DATABASE_URL` is used with SSL enabled.

## API Reference

All routes except `/api/auth/login` and `/api/auth/seed` require an `Authorization: Bearer <token>` header.

### Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | — | Login; returns JWT token |
| `GET` | `/api/auth/me` | Any | Get current user info |
| `POST` | `/api/auth/seed` | — | Create a user (setup only) |

### Products

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/products` | Any | List all products |
| `POST` | `/api/products` | Owner | Create a product |
| `PUT` | `/api/products/:id` | Owner | Update a product |
| `DELETE` | `/api/products/:id` | Owner | Delete a product |

### Inventory

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/inventory` | Any | List stock levels with low-stock flags |
| `PUT` | `/api/inventory/:productId` | Any | Update stock quantity |

### Sales

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/sales/summary` | Any | Today's revenue, units, top products |
| `GET` | `/api/sales` | Any | Paginated list (`from`, `to`, `page`, `limit` params) |
| `POST` | `/api/sales` | Any | Record sale(s); atomically decrements inventory |
| `DELETE` | `/api/sales/:id` | Any | Delete a sale record |

### Customers

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/customers` | Any | List customers |
| `POST` | `/api/customers` | Any | Create customer |
| `PUT` | `/api/customers/:id` | Any | Update customer |
| `DELETE` | `/api/customers/:id` | Any | Delete customer |

### Forecast, Alerts & ETL

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/forecast/:productId` | Any | 28-day history + 7-day moving-average forecast |
| `GET` | `/api/alerts` | Any | Low-stock product alerts |
| `POST` | `/api/etl/refresh` | Owner | Full warehouse rebuild in a single transaction |

### CSV Import (Owner only)

| Method | Path | Expected columns |
|---|---|---|
| `POST` | `/api/import/products` | `name`, `price`, `category`, `sku`, `cost` |
| `POST` | `/api/import/inventory` | product `name`/`sku`, `stock`, `low_stock_threshold` |
| `POST` | `/api/import/customers` | `name`, `email`, `phone`, `loyalty_points` |
| `POST` | `/api/import/sales` | product `name`/`sku`, `quantity`, `sale_price`, `date` |

Column matching is case-insensitive and ignores underscores and spaces. Maximum file size: 10 MB.

## Testing

There is no automated test suite. Manual testing paths:

- Start local servers and verify API responses via curl or Postman.
- Upload the CSVs in `/sample-data/` to exercise the import flow end-to-end.
- Call `POST /api/etl/refresh` and verify the warehouse and marts tables are rebuilt correctly.

## Deployment

### Backend (Railway)

1. Create a Railway project and provision a PostgreSQL database.
2. Point Railway at the `/server` directory.
3. Set environment variables in the Railway dashboard (see Configuration section).
4. Set the build and start commands:
   - **Build:** `npm run build` (inside `server/`, runs `tsc` then copies migration files)
   - **Start:** `node dist/index.js`
5. The migration runs automatically on first startup and is skipped on subsequent restarts.

### Frontend (Vercel)

1. Import the repository into Vercel and set **Root Directory** to `client/`.
2. Vercel auto-detects Vite; the default settings work:
   - **Build command:** `tsc -b && vite build`
   - **Output directory:** `dist`
3. Update `client/vercel.json` to point to your Railway backend URL:

   ```json
   {
     "rewrites": [
       { "source": "/api/:path*", "destination": "https://your-app.up.railway.app/api/:path*" },
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

4. Deploy — no environment variables are needed on the Vercel side.

## Contributing

1. Fork the repository and create a feature branch from `main`.
2. Run `npm run install:all` and configure your local `.env`.
3. Make your changes; the server reloads automatically via `ts-node-dev`.
4. Ensure ESLint passes: `cd client && npm run lint`.
5. Open a pull request against `main` with a clear description of the change.

Keep all SQL queries parameterized and follow the existing role-based middleware pattern when adding new routes.

## License

No license file is present in this repository. All rights reserved by the author unless otherwise stated.
