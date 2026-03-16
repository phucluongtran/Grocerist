import { Router, Response } from 'express';
import pool from '../db/pool';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', async (_req, res: Response) => {
  const lowStock = await pool.query(
    `SELECT p.name, i.stock, p.low_stock_threshold
     FROM app.inventory i JOIN app.products p ON p.id = i.product_id
     WHERE i.stock <= p.low_stock_threshold
     ORDER BY i.stock ASC`
  );
  res.json({
    low_stock: lowStock.rows,
  });
});

export default router;
