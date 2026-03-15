import { Router, Request, Response } from 'express';
import pool from '../db/pool';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', async (_req, res: Response) => {
  const result = await pool.query('SELECT * FROM customers ORDER BY name ASC');
  res.json(result.rows);
});

router.post('/', async (req: Request, res: Response) => {
  const { name, email, phone, notes } = req.body;
  const result = await pool.query(
    'INSERT INTO customers (name, email, phone, notes) VALUES ($1,$2,$3,$4) RETURNING *',
    [name, email, phone, notes]
  );
  res.status(201).json(result.rows[0]);
});

router.put('/:id', async (req: Request, res: Response) => {
  const { name, email, phone, notes } = req.body;
  const result = await pool.query(
    'UPDATE customers SET name=$1, email=$2, phone=$3, notes=$4 WHERE id=$5 RETURNING *',
    [name, email, phone, notes, req.params.id]
  );
  if (!result.rows[0]) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(result.rows[0]);
});

router.delete('/:id', async (req: Request, res: Response) => {
  await pool.query('DELETE FROM customers WHERE id=$1', [req.params.id]);
  res.status(204).send();
});

export default router;
