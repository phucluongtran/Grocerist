import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_PRIVATE_URL || process.env.DATABASE_URL;
const useSSL = !process.env.DATABASE_PRIVATE_URL && !!process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

export default pool;
