import { Router, Response } from 'express';
import pool from '../db/pool';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', async (_req, res: Response) => {
  const result = await pool.query(`
    SELECT i.*, p.name, p.category, p.sku, p.price, p.cost, p.low_stock_threshold,
           (i.stock <= p.low_stock_threshold) AS low_stock
    FROM app.inventory i
    JOIN app.products p ON p.id = i.product_id
    ORDER BY p.name ASC
  `);
  res.json(result.rows);
});

router.put('/:productId', async (req: AuthRequest, res: Response) => {
  const { stock } = req.body;
  const result = await pool.query(
    `UPDATE app.inventory
     SET stock = COALESCE($1, stock),
         last_updated = NOW()
     WHERE product_id = $2
     RETURNING *`,
    [stock ?? null, req.params.productId]
  );
  if (!result.rows[0]) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(result.rows[0]);
});

export default router;
