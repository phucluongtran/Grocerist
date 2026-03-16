-- Phase 1: Create new schemas
CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS stg;
CREATE SCHEMA IF NOT EXISTS wh;
CREATE SCHEMA IF NOT EXISTS marts;

-- 1.2 app.users
CREATE TABLE IF NOT EXISTS app.users (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner','staff')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO app.users (id, name, email, password_hash, role, created_at)
  SELECT id, NULL, email, password_hash, role, created_at FROM public.users;
SELECT setval(pg_get_serial_sequence('app.users','id'), COALESCE((SELECT MAX(id) FROM app.users),1));

-- 1.3 app.products
CREATE TABLE IF NOT EXISTS app.products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  category TEXT,
  price NUMERIC(10,2) NOT NULL,
  cost NUMERIC(10,2),
  low_stock_threshold INT NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO app.products (id, name, sku, category, price, cost, low_stock_threshold, created_at)
  SELECT p.id, p.name, p.sku, p.category, p.price, NULL,
         COALESCE(i.low_stock_threshold, 10), p.created_at
  FROM public.products p LEFT JOIN public.inventory i ON i.product_id = p.id;
SELECT setval(pg_get_serial_sequence('app.products','id'), COALESCE((SELECT MAX(id) FROM app.products),1));

-- 1.4 app.customers
CREATE TABLE IF NOT EXISTS app.customers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  loyalty_points INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO app.customers (id, name, email, phone, loyalty_points, created_at)
  SELECT id, name, email, phone, 0, joined_at FROM public.customers;
SELECT setval(pg_get_serial_sequence('app.customers','id'), COALESCE((SELECT MAX(id) FROM app.customers),1));

-- 1.5 app.inventory
CREATE TABLE IF NOT EXISTS app.inventory (
  id SERIAL PRIMARY KEY,
  product_id INT UNIQUE REFERENCES app.products(id) ON DELETE CASCADE,
  stock INT NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO app.inventory (id, product_id, stock, last_updated)
  SELECT id, product_id, quantity, COALESCE(updated_at, NOW()) FROM public.inventory;
SELECT setval(pg_get_serial_sequence('app.inventory','id'), COALESCE((SELECT MAX(id) FROM app.inventory),1));

-- 1.6 app.sales
CREATE TABLE IF NOT EXISTS app.sales (
  id SERIAL PRIMARY KEY,
  product_id INT REFERENCES app.products(id),
  customer_id INT REFERENCES app.customers(id) ON DELETE SET NULL,
  quantity INT NOT NULL,
  sale_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by INT REFERENCES app.users(id) ON DELETE SET NULL
);
INSERT INTO app.sales (id, product_id, customer_id, quantity, sale_price, created_at, created_by)
  SELECT id, product_id, NULL, quantity, sale_price, sold_at, NULL FROM public.sales;
SELECT setval(pg_get_serial_sequence('app.sales','id'), COALESCE((SELECT MAX(id) FROM app.sales),1));

-- 1.7 stg tables
CREATE TABLE IF NOT EXISTS stg.sales (
  sale_id INT,
  product_id INT,
  customer_id INT,
  quantity INT,
  price NUMERIC(10,2),
  sale_timestamp TIMESTAMPTZ,
  loaded_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'app.sales'
);
CREATE TABLE IF NOT EXISTS stg.products (
  product_id INT,
  name TEXT,
  sku TEXT,
  category TEXT,
  price NUMERIC(10,2),
  cost NUMERIC(10,2),
  loaded_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS stg.customers (
  customer_id INT,
  name TEXT,
  email TEXT,
  phone TEXT,
  loyalty_points INT,
  loaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.8 wh tables
CREATE TABLE IF NOT EXISTS wh.dim_products (
  product_id INT PRIMARY KEY,
  name TEXT,
  category TEXT,
  price NUMERIC(10,2),
  cost NUMERIC(10,2)
);
CREATE TABLE IF NOT EXISTS wh.dim_customers (
  customer_id INT PRIMARY KEY,
  name TEXT,
  segment TEXT,
  signup_date DATE
);
CREATE TABLE IF NOT EXISTS wh.dim_date (
  date_id INT PRIMARY KEY,
  date DATE,
  day INT,
  month INT,
  year INT,
  weekday TEXT,
  is_weekend BOOLEAN
);
CREATE TABLE IF NOT EXISTS wh.fact_sales (
  sale_id INT PRIMARY KEY,
  product_id INT REFERENCES wh.dim_products(product_id),
  customer_id INT REFERENCES wh.dim_customers(customer_id),
  date_id INT REFERENCES wh.dim_date(date_id),
  quantity INT,
  revenue NUMERIC(10,2),
  profit NUMERIC(10,2)
);

-- 1.9 marts tables
CREATE TABLE IF NOT EXISTS marts.daily_sales_summary (
  date DATE PRIMARY KEY,
  total_orders INT,
  items_sold INT,
  revenue NUMERIC(10,2)
);
CREATE TABLE IF NOT EXISTS marts.product_performance (
  product_id INT PRIMARY KEY,
  units_sold INT,
  total_revenue NUMERIC(10,2),
  last_sale_date DATE
);

-- 1.10 Drop obsolete public tables
DROP TABLE IF EXISTS public.todos;
DROP TABLE IF EXISTS public.promotions;
DROP TABLE IF EXISTS public.inventory;
DROP TABLE IF EXISTS public.sales;
DROP TABLE IF EXISTS public.customers;
DROP TABLE IF EXISTS public.products;
DROP TABLE IF EXISTS public.users;
