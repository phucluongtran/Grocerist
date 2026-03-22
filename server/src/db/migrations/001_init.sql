-- Drop everything and start fresh
DROP SCHEMA IF EXISTS marts CASCADE;
DROP SCHEMA IF EXISTS wh CASCADE;
DROP SCHEMA IF EXISTS stg CASCADE;
DROP SCHEMA IF EXISTS app CASCADE;
DROP TABLE IF EXISTS public.todos CASCADE;
DROP TABLE IF EXISTS public.promotions CASCADE;
DROP TABLE IF EXISTS public.inventory CASCADE;
DROP TABLE IF EXISTS public.sales CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Create schemas
CREATE SCHEMA app;
CREATE SCHEMA stg;
CREATE SCHEMA wh;
CREATE SCHEMA marts;

-- app.users
CREATE TABLE app.users (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner','staff')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- app.products
CREATE TABLE app.products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  category TEXT,
  price NUMERIC(10,2) NOT NULL,
  cost NUMERIC(10,2),
  low_stock_threshold INT NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- app.customers
CREATE TABLE app.customers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  loyalty_points INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- app.inventory
CREATE TABLE app.inventory (
  id SERIAL PRIMARY KEY,
  product_id INT UNIQUE REFERENCES app.products(id) ON DELETE CASCADE,
  stock INT NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- app.sales
CREATE TABLE app.sales (
  id SERIAL PRIMARY KEY,
  product_id INT REFERENCES app.products(id),
  customer_id INT REFERENCES app.customers(id) ON DELETE SET NULL,
  quantity INT NOT NULL,
  sale_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by INT REFERENCES app.users(id) ON DELETE SET NULL
);

-- stg tables
CREATE TABLE stg.sales (
  sale_id INT,
  product_id INT,
  customer_id INT,
  quantity INT,
  price NUMERIC(10,2),
  sale_timestamp TIMESTAMPTZ,
  loaded_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'app.sales'
);
CREATE TABLE stg.products (
  product_id INT,
  name TEXT,
  sku TEXT,
  category TEXT,
  price NUMERIC(10,2),
  cost NUMERIC(10,2),
  loaded_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE stg.customers (
  customer_id INT,
  name TEXT,
  email TEXT,
  phone TEXT,
  loyalty_points INT,
  loaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- wh tables
CREATE TABLE wh.dim_products (
  product_id INT PRIMARY KEY,
  name TEXT,
  category TEXT,
  price NUMERIC(10,2),
  cost NUMERIC(10,2)
);
CREATE TABLE wh.dim_customers (
  customer_id INT PRIMARY KEY,
  name TEXT,
  segment TEXT,
  signup_date DATE
);
CREATE TABLE wh.dim_date (
  date_id INT PRIMARY KEY,
  date DATE,
  day INT,
  month INT,
  year INT,
  weekday TEXT,
  is_weekend BOOLEAN
);
CREATE TABLE wh.fact_sales (
  sale_id INT PRIMARY KEY,
  product_id INT REFERENCES wh.dim_products(product_id),
  customer_id INT REFERENCES wh.dim_customers(customer_id),
  date_id INT REFERENCES wh.dim_date(date_id),
  quantity INT,
  revenue NUMERIC(10,2),
  profit NUMERIC(10,2)
);

-- marts tables
CREATE TABLE marts.daily_sales_summary (
  date DATE PRIMARY KEY,
  total_orders INT,
  items_sold INT,
  revenue NUMERIC(10,2)
);
CREATE TABLE marts.product_performance (
  product_id INT PRIMARY KEY,
  units_sold INT,
  total_revenue NUMERIC(10,2),
  last_sale_date DATE
);
