const { Pool } = require('pg');
require('dotenv').config();

const connStr = process.env.DIRECT_URL || process.env.DATABASE_URL;
console.log('Connecting to:', connStr.replace(/:[^:@]+@/, ':****@'));

const pool = new Pool({
  connectionString: connStr,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query('SELECT count(*) FROM "User"');
    console.log('SUCCESS! Found users:', res.rows[0].count);
    const consoles = await pool.query('SELECT id, "hardwareTitle" FROM "Console"');
    console.log('SUCCESS! Consoles in DB:', consoles.rows);
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await pool.end();
  }
}

run();
