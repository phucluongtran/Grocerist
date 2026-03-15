import { Router, Response } from 'express';
import pool from '../db/pool';
import { requireAuth, requireOwner, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', async (_req, res: Response) => {
  const result = await pool.query(
    'SELECT * FROM products ORDER BY name ASC'
  );
  res.json(result.rows);
});

router.post('/', requireOwner, async (req: AuthRequest, res: Response) => {
  const { name, category, sku, price, unit } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const prod = await client.query(
      'INSERT INTO products (name, category, sku, price, unit) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, category, sku, price, unit || 'each']
    );
    await client.query(
      'INSERT INTO inventory (product_id, quantity, low_stock_threshold) VALUES ($1, 0, 10)',
      [prod.rows[0].id]
    );
    await client.query('COMMIT');
    res.status(201).json(prod.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

router.put('/:id', requireOwner, async (req: AuthRequest, res: Response) => {
  const { name, category, sku, price, unit } = req.body;
  const result = await pool.query(
    'UPDATE products SET name=$1, category=$2, sku=$3, price=$4, unit=$5 WHERE id=$6 RETURNING *',
    [name, category, sku, price, unit, req.params.id]
  );
  if (!result.rows[0]) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(result.rows[0]);
});

router.delete('/:id', requireOwner, async (req: AuthRequest, res: Response) => {
  await pool.query('DELETE FROM products WHERE id=$1', [req.params.id]);
  res.status(204).send();
});

export default router;
