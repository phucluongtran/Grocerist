import fs from 'fs';
import path from 'path';
import pool from './pool';

export async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const { rows } = await pool.query<{ filename: string }>(
    'SELECT filename FROM public.schema_migrations'
  );
  const applied = new Set(rows.map((r) => r.filename));

  const files = ['001_init.sql', '002_constraints.sql', '003_schema_restructure.sql'];
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`Skipping migration (already applied): ${file}`);
      continue;
    }
    const sql = fs.readFileSync(path.join(__dirname, 'migrations', file), 'utf-8');
    await pool.query(sql);
    await pool.query('INSERT INTO public.schema_migrations (filename) VALUES ($1)', [file]);
    console.log(`Ran migration: ${file}`);
  }
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
