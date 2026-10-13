import 'dotenv/config';
import { Pool } from 'pg';

const connStr = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connStr) {
  console.error('❌ Neither DIRECT_URL nor DATABASE_URL found in .env');
  process.exit(1);
}

console.log('🔌 Connecting to PostgreSQL:', connStr.replace(/:[^:@]+@/, ':****@'));

const pool = new Pool({
  connectionString: connStr,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query('SELECT count(*) FROM "User"');
    console.log('✅ SUCCESS! Found users:', res.rows[0].count);

    const consoles = await pool.query('SELECT id, "hardwareTitle" FROM "Console"');
    console.log('✅ Consoles in DB:', consoles.rows);

    const products = await pool.query('SELECT id, name, price, category FROM "Product" LIMIT 5');
    console.log('✅ Sample Products in DB:', products.rows);
  } catch (err) {
    console.error('❌ Connection ERROR:', err);
  } finally {
    await pool.end();
  }
}

run();
