-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'staff')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  sku TEXT UNIQUE,
  price NUMERIC(10,2) NOT NULL,
  unit TEXT DEFAULT 'each',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 0,
  low_stock_threshold INT NOT NULL DEFAULT 10,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales
CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  product_id INT REFERENCES products(id),
  quantity INT NOT NULL,
  sale_price NUMERIC(10,2) NOT NULL,
  sold_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promotions
CREATE TABLE IF NOT EXISTS promotions (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  discount_pct NUMERIC(5,2),
  target_segment TEXT DEFAULT 'all',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Todos
CREATE TABLE IF NOT EXISTS todos (
  id SERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
