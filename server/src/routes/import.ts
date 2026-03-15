import { Router, Response } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse';
import { Readable } from 'stream';
import pool from '../db/pool';
import { requireAuth, requireOwner, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);
router.use(requireOwner);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function parseCSV(buffer: Buffer): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const rows: Record<string, string>[] = [];
    Readable.from(buffer)
      .pipe(parse({ columns: true, skip_empty_lines: true, trim: true }))
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

function col(row: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    const found = Object.keys(row).find((c) => c.toLowerCase().replace(/[\s_-]/g, '') === k.toLowerCase().replace(/[\s_-]/g, ''));
    if (found && row[found] !== undefined && row[found] !== '') return row[found];
  }
  return '';
}

// POST /api/import/products
router.post('/products', upload.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
  const rows = await parseCSV(req.file.buffer);
  const client = await pool.connect();
  let imported = 0, skipped = 0;
  try {
    await client.query('BEGIN');
    for (const row of rows) {
      const name = col(row, 'name', 'productname', 'product');
      const price = parseFloat(col(row, 'price', 'cost', 'saleprice') || '0');
      if (!name || isNaN(price) || price <= 0) { skipped++; continue; }
      const category = col(row, 'category', 'type', 'department');
      const sku = col(row, 'sku', 'barcode', 'code', 'id');
      const unit = col(row, 'unit', 'uom', 'measure') || 'each';
      const prod = await client.query(
        `INSERT INTO products (name, category, sku, price, unit)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (sku) DO UPDATE SET name=$1, category=$2, price=$4, unit=$5
         RETURNING id`,
        [name, category || null, sku || null, price, unit]
      );
      await client.query(
        `INSERT INTO inventory (product_id, quantity, low_stock_threshold)
         VALUES ($1, 0, 10)
         ON CONFLICT (product_id) DO NOTHING`,
        [prod.rows[0].id]
      );
      imported++;
    }
    await client.query('COMMIT');
    res.json({ imported, skipped, total: rows.length });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// POST /api/import/inventory
router.post('/inventory', upload.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
  const rows = await parseCSV(req.file.buffer);
  let imported = 0, skipped = 0;
  for (const row of rows) {
    const nameOrSku = col(row, 'productname', 'name', 'product', 'sku', 'barcode', 'code');
    const quantity = parseInt(col(row, 'quantity', 'qty', 'stock', 'stocklevel') || '-1');
    if (!nameOrSku || quantity < 0) { skipped++; continue; }
    const threshold = parseInt(col(row, 'threshold', 'minstockthreshold', 'lowstockthreshold', 'minqty') || '10');
    // find product by name or sku
    const prod = await pool.query(
      `SELECT id FROM products WHERE LOWER(name)=LOWER($1) OR (sku IS NOT NULL AND LOWER(sku)=LOWER($1))`,
      [nameOrSku]
    );
    if (!prod.rows[0]) { skipped++; continue; }
    await pool.query(
      `INSERT INTO inventory (product_id, quantity, low_stock_threshold)
       VALUES ($1,$2,$3)
       ON CONFLICT (product_id) DO UPDATE SET quantity=$2, low_stock_threshold=$3, updated_at=NOW()`,
      [prod.rows[0].id, quantity, isNaN(threshold) ? 10 : threshold]
    );
    imported++;
  }
  res.json({ imported, skipped, total: rows.length });
});

// POST /api/import/customers
router.post('/customers', upload.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
  const rows = await parseCSV(req.file.buffer);
  let imported = 0, skipped = 0;
  for (const row of rows) {
    const name = col(row, 'name', 'fullname', 'customername', 'firstname');
    if (!name) { skipped++; continue; }
    const email = col(row, 'email', 'emailaddress', 'mail');
    const phone = col(row, 'phone', 'phonenumber', 'mobile', 'tel');
    const notes = col(row, 'notes', 'note', 'comments', 'comment');
    await pool.query(
      `INSERT INTO customers (name, email, phone, notes) VALUES ($1,$2,$3,$4)`,
      [name, email || null, phone || null, notes || null]
    );
    imported++;
  }
  res.json({ imported, skipped, total: rows.length });
});

// POST /api/import/sales
router.post('/sales', upload.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
  const rows = await parseCSV(req.file.buffer);
  let imported = 0, skipped = 0;
  for (const row of rows) {
    const nameOrSku = col(row, 'productname', 'name', 'product', 'sku', 'barcode', 'code');
    const quantity = parseInt(col(row, 'quantity', 'qty', 'units') || '0');
    const salePrice = parseFloat(col(row, 'saleprice', 'price', 'unitprice', 'amount') || '0');
    if (!nameOrSku || quantity <= 0 || isNaN(salePrice) || salePrice <= 0) { skipped++; continue; }
    const soldAt = col(row, 'soldat', 'date', 'saledate', 'datetime', 'timestamp');
    const prod = await pool.query(
      `SELECT id FROM products WHERE LOWER(name)=LOWER($1) OR (sku IS NOT NULL AND LOWER(sku)=LOWER($1))`,
      [nameOrSku]
    );
    if (!prod.rows[0]) { skipped++; continue; }
    await pool.query(
      `INSERT INTO sales (product_id, quantity, sale_price, sold_at)
       VALUES ($1,$2,$3,$4)`,
      [prod.rows[0].id, quantity, salePrice, soldAt ? new Date(soldAt) : new Date()]
    );
    imported++;
  }
  res.json({ imported, skipped, total: rows.length });
});

export default router;
