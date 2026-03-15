import { Router, Request, Response } from 'express';
import pool from '../db/pool';
import { requireAuth, requireOwner } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', async (_req, res: Response) => {
  const result = await pool.query('SELECT * FROM promotions ORDER BY created_at DESC');
  res.json(result.rows);
});

router.post('/', requireOwner, async (req: Request, res: Response) => {
  const { title, description, discount_pct, target_segment } = req.body;
  const result = await pool.query(
    'INSERT INTO promotions (title, description, discount_pct, target_segment) VALUES ($1,$2,$3,$4) RETURNING *',
    [title, description, discount_pct, target_segment || 'all']
  );
  res.status(201).json(result.rows[0]);
});

router.delete('/:id', requireOwner, async (req: Request, res: Response) => {
  await pool.query('DELETE FROM promotions WHERE id=$1', [req.params.id]);
  res.status(204).send();
});

export default router;
