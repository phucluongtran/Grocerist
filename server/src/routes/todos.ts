import { Router, Request, Response } from 'express';
import pool from '../db/pool';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', async (_req, res: Response) => {
  const result = await pool.query(
    `SELECT * FROM todos
     WHERE due_date IS NULL OR due_date = CURRENT_DATE
     ORDER BY completed ASC, created_at ASC`
  );
  res.json(result.rows);
});

router.post('/', async (req: Request, res: Response) => {
  const { text, due_date } = req.body;
  const result = await pool.query(
    'INSERT INTO todos (text, due_date) VALUES ($1,$2) RETURNING *',
    [text, due_date || null]
  );
  res.status(201).json(result.rows[0]);
});

router.put('/:id', async (req: Request, res: Response) => {
  const { text, completed, due_date } = req.body;
  const result = await pool.query(
    `UPDATE todos
     SET text = COALESCE($1, text),
         completed = COALESCE($2, completed),
         due_date = COALESCE($3, due_date)
     WHERE id = $4 RETURNING *`,
    [text ?? null, completed ?? null, due_date ?? null, req.params.id]
  );
  if (!result.rows[0]) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(result.rows[0]);
});

router.delete('/:id', async (req: Request, res: Response) => {
  await pool.query('DELETE FROM todos WHERE id=$1', [req.params.id]);
  res.status(204).send();
});

export default router;
