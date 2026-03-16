import { Router, Request, Response } from 'express';
import pool from '../db/pool';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/:productId', async (req: Request, res: Response) => {
  const { productId } = req.params;

  // Past 28 days of actual daily sales
  const actual = await pool.query(
    `SELECT created_at::date AS date, SUM(quantity) AS qty
     FROM app.sales
     WHERE product_id = $1 AND created_at >= NOW() - INTERVAL '28 days'
     GROUP BY created_at::date
     ORDER BY date ASC`,
    [productId]
  );

  // Compute simple moving average from past 28 days
  const totalQty = actual.rows.reduce((sum: number, r: { qty: string }) => sum + parseFloat(r.qty), 0);
  const days = actual.rows.length || 1;
  const avgPerDay = totalQty / days;

  const forecast = [];
  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    forecast.push({
      date: d.toISOString().split('T')[0],
      predicted_qty: parseFloat(avgPerDay.toFixed(2)),
    });
  }

  res.json({
    actual: actual.rows.map((r: { date: string; qty: string }) => ({ date: r.date, qty: parseFloat(r.qty) })),
    forecast,
  });
});

export default router;
