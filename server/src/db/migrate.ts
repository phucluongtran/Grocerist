import fs from 'fs';
import path from 'path';
import pool from './pool';

export async function migrate() {
  const { rows } = await pool.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'app' AND table_name = 'users'
    ) AS exists
  `);

  if (rows[0].exists) {
    console.log('Database already initialized, skipping migration.');
    return;
  }

  const sql = fs.readFileSync(path.join(__dirname, 'migrations', '001_init.sql'), 'utf-8');
  await pool.query(sql);
  console.log('Migration complete.');
}

// Allow running directly: ts-node src/db/migrate.ts
if (require.main === module) {
  migrate()
    .then(() => pool.end())
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
