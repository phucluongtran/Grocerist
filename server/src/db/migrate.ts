import fs from 'fs';
import path from 'path';
import pool from './pool';

async function migrate() {
  const files = ['001_init.sql', '002_constraints.sql', '003_schema_restructure.sql'];
  for (const file of files) {
    const sql = fs.readFileSync(path.join(__dirname, 'migrations', file), 'utf-8');
    await pool.query(sql);
    console.log(`Ran migration: ${file}`);
  }
  console.log('Migration complete.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
