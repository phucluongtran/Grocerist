import { Router, Response } from 'express';
import pool from '../db/pool';
import { requireAuth, requireOwner, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);
router.use(requireOwner);

router.post('/refresh', async (_req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Truncate stg tables
    await client.query('TRUNCATE stg.sales, stg.products, stg.customers');

    // 2. Load stg.products
    await client.query(`
      INSERT INTO stg.products (product_id, name, sku, category, price, cost)
      SELECT id, name, sku, category, price, cost FROM app.products
    `);

    // 3. Load stg.customers
    await client.query(`
      INSERT INTO stg.customers (customer_id, name, email, phone, loyalty_points)
      SELECT id, name, email, phone, loyalty_points FROM app.customers
    `);

    // 4. Load stg.sales
    await client.query(`
      INSERT INTO stg.sales (sale_id, product_id, customer_id, quantity, price, sale_timestamp)
      SELECT id, product_id, customer_id, quantity, sale_price, created_at FROM app.sales
    `);

    // 5. Truncate wh fact first, then dims
    await client.query('TRUNCATE wh.fact_sales, wh.dim_products, wh.dim_customers');

    // 6. Load wh.dim_products
    await client.query(`
      INSERT INTO wh.dim_products (product_id, name, category, price, cost)
      SELECT product_id, name, category, price, cost FROM stg.products
    `);

    // 7. Load wh.dim_customers (segment derived from loyalty_points)
    await client.query(`
      INSERT INTO wh.dim_customers (customer_id, name, segment, signup_date)
      SELECT customer_id, name,
        CASE
          WHEN loyalty_points >= 100 THEN 'loyal'
          WHEN loyalty_points >= 10  THEN 'regular'
          ELSE 'new'
        END,
        NULL
      FROM stg.customers
    `);

    // 8. Load wh.dim_date using generate_series over sales date range
    await client.query(`
      INSERT INTO wh.dim_date (date_id, date, day, month, year, weekday, is_weekend)
      SELECT
        TO_CHAR(d, 'YYYYMMDD')::INT,
        d::DATE,
        EXTRACT(DAY FROM d)::INT,
        EXTRACT(MONTH FROM d)::INT,
        EXTRACT(YEAR FROM d)::INT,
        TO_CHAR(d, 'Day'),
        EXTRACT(DOW FROM d) IN (0, 6)
      FROM (
        SELECT generate_series(
          (SELECT MIN(sale_timestamp)::DATE FROM stg.sales),
          (SELECT MAX(sale_timestamp)::DATE FROM stg.sales),
          '1 day'::INTERVAL
        ) AS d
      ) dates
      ON CONFLICT DO NOTHING
    `);

    // 9. Load wh.fact_sales
    await client.query(`
      INSERT INTO wh.fact_sales (sale_id, product_id, customer_id, date_id, quantity, revenue, profit)
      SELECT
        s.sale_id,
        s.product_id,
        s.customer_id,
        TO_CHAR(s.sale_timestamp::DATE, 'YYYYMMDD')::INT,
        s.quantity,
        s.quantity * s.price,
        s.quantity * (s.price - COALESCE(p.cost, 0))
      FROM stg.sales s
      JOIN stg.products p ON p.product_id = s.product_id
    `);

    // 10. Truncate marts
    await client.query('TRUNCATE marts.daily_sales_summary, marts.product_performance');

    // 11. Load marts.daily_sales_summary
    await client.query(`
      INSERT INTO marts.daily_sales_summary (date, total_orders, items_sold, revenue)
      SELECT
        d.date,
        COUNT(f.sale_id)::INT,
        COALESCE(SUM(f.quantity), 0)::INT,
        COALESCE(SUM(f.revenue), 0)
      FROM wh.fact_sales f
      JOIN wh.dim_date d ON d.date_id = f.date_id
      GROUP BY d.date
    `);

    // 12. Load marts.product_performance
    await client.query(`
      INSERT INTO marts.product_performance (product_id, units_sold, total_revenue, last_sale_date)
      SELECT
        f.product_id,
        COALESCE(SUM(f.quantity), 0)::INT,
        COALESCE(SUM(f.revenue), 0),
        MAX(d.date)
      FROM wh.fact_sales f
      JOIN wh.dim_date d ON d.date_id = f.date_id
      GROUP BY f.product_id
    `);

    await client.query('COMMIT');
    res.json({ success: true, refreshed_at: new Date().toISOString() });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

export default router;
