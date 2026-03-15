import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db/pool';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

router.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

// Seed route — creates owner account if none exists (dev/setup only)
router.post('/seed', async (req: Request, res: Response) => {
  const { email, password, role = 'owner', secret } = req.body;
  if (secret !== process.env.SEED_SECRET && process.env.NODE_ENV === 'production') {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  const hash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
    [email, hash, role]
  );
  res.status(201).json({ user: result.rows[0] });
});

export default router;
