import { Router, Response } from 'express';
import pool from '../db/pool';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', async (_req, res: Response) => {
  const lowStock = await pool.query(
    `SELECT p.name, i.quantity, i.low_stock_threshold
     FROM inventory i JOIN products p ON p.id = i.product_id
     WHERE i.quantity <= i.low_stock_threshold
     ORDER BY i.quantity ASC`
  );
  res.json({
    low_stock: lowStock.rows,
  });
});

export default router;
