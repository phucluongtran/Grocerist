import { Router, Request, Response } from 'express';
import pool from '../db/pool';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', async (_req, res: Response) => {
  const result = await pool.query('SELECT * FROM app.customers ORDER BY name ASC');
  res.json(result.rows);
});

router.post('/', async (req: Request, res: Response) => {
  const { name, email, phone, loyalty_points } = req.body;
  if (!name) { res.status(400).json({ error: 'name is required' }); return; }
  const result = await pool.query(
    'INSERT INTO app.customers (name, email, phone, loyalty_points) VALUES ($1,$2,$3,$4) RETURNING *',
    [name, email, phone, loyalty_points ?? 0]
  );
  res.status(201).json(result.rows[0]);
});

router.put('/:id', async (req: Request, res: Response) => {
  const { name, email, phone, loyalty_points } = req.body;
  if (!name) { res.status(400).json({ error: 'name is required' }); return; }
  const result = await pool.query(
    'UPDATE app.customers SET name=$1, email=$2, phone=$3, loyalty_points=$4 WHERE id=$5 RETURNING *',
    [name, email, phone, loyalty_points ?? 0, req.params.id]
  );
  if (!result.rows[0]) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(result.rows[0]);
});

router.delete('/:id', async (req: Request, res: Response) => {
  await pool.query('DELETE FROM app.customers WHERE id=$1', [req.params.id]);
  res.status(204).send();
});

export default router;
