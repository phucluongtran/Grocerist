import { Router, Response } from 'express';
import pool from '../db/pool';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', async (_req, res: Response) => {
  const result = await pool.query(`
    SELECT i.*, p.name, p.category, p.sku, p.price, p.unit,
           (i.quantity <= i.low_stock_threshold) AS low_stock
    FROM inventory i
    JOIN products p ON p.id = i.product_id
    ORDER BY p.name ASC
  `);
  res.json(result.rows);
});

router.put('/:productId', async (req: AuthRequest, res: Response) => {
  const { quantity, low_stock_threshold } = req.body;
  const result = await pool.query(
    `UPDATE inventory
     SET quantity = COALESCE($1, quantity),
         low_stock_threshold = COALESCE($2, low_stock_threshold),
         updated_at = NOW()
     WHERE product_id = $3
     RETURNING *`,
    [quantity ?? null, low_stock_threshold ?? null, req.params.productId]
  );
  if (!result.rows[0]) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(result.rows[0]);
});

export default router;
