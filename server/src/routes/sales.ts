import { Router, Request, Response } from 'express';
import pool from '../db/pool';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/summary', async (_req: Request, res: Response) => {
  const revenue = await pool.query(
    `SELECT COALESCE(SUM(quantity * sale_price), 0) AS total_revenue,
            COALESCE(SUM(quantity), 0) AS total_units
     FROM app.sales WHERE created_at::date = CURRENT_DATE`
  );
  const top = await pool.query(
    `SELECT p.name, SUM(s.quantity) AS units_sold
     FROM app.sales s JOIN app.products p ON p.id = s.product_id
     WHERE s.created_at::date = CURRENT_DATE
     GROUP BY p.name ORDER BY units_sold DESC LIMIT 3`
  );
  res.json({ ...revenue.rows[0], top_products: top.rows });
});

router.get('/', async (req: Request, res: Response) => {
  const { from, to, page = '1', limit = '50' } = req.query as Record<string, string>;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params: (string | number)[] = [];
  let where = '';
  if (from) { params.push(from); where += ` AND s.created_at >= $${params.length}`; }
  if (to)   { params.push(to);   where += ` AND s.created_at <= $${params.length}`; }
  params.push(parseInt(limit), offset);
  const result = await pool.query(
    `SELECT s.*, p.name AS product_name
     FROM app.sales s JOIN app.products p ON p.id = s.product_id
     WHERE 1=1 ${where}
     ORDER BY s.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  res.json(result.rows);
});

router.post('/', async (req: Request, res: Response) => {
  const { product_id, quantity, sale_price, customer_id, created_by } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const inv = await client.query(
      'SELECT stock FROM app.inventory WHERE product_id = $1 FOR UPDATE',
      [product_id]
    );
    if (!inv.rows[0]) { res.status(404).json({ error: 'Product not in inventory' }); return; }
    const newStock = inv.rows[0].stock - quantity;
    if (newStock < 0) { res.status(400).json({ error: 'Insufficient stock' }); return; }
    await client.query(
      'UPDATE app.inventory SET stock = $1, last_updated = NOW() WHERE product_id = $2',
      [newStock, product_id]
    );
    const sale = await client.query(
      'INSERT INTO app.sales (product_id, customer_id, quantity, sale_price, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [product_id, customer_id || null, quantity, sale_price, created_by || null]
    );
    await client.query('COMMIT');
    res.status(201).json(sale.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  await pool.query('DELETE FROM app.sales WHERE id=$1', [req.params.id]);
  res.status(204).send();
});

export default router;
