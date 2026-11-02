import 'dotenv/config';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const connStr = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!connStr) {
  console.error('❌ Missing DATABASE_URL in .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString: connStr,
  ssl: { rejectUnauthorized: false }
});

async function makeAdmin() {
  const target = process.argv[2] || 'admin@udhyanagames.com';
  const customPassword = process.argv[3] || 'Admin#Initial2026';

  console.log(`\n👑 Admin Account Setup Script`);
  console.log(`---------------------------------`);
  console.log(`Target identifier: ${target}`);

  try {
    // Check if user exists
    const findRes = await pool.query(
      'SELECT id, username, email, role FROM "User" WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($1)',
      [target]
    );

    if (findRes.rows.length > 0) {
      const user = findRes.rows[0];
      console.log(`Found existing user: @${user.username} (${user.email}) - Current Role: ${user.role}`);
      
      const hashedPassword = await bcrypt.hash(customPassword, 12);
      await pool.query(
        'UPDATE "User" SET role = $1, status = $2, password = $3 WHERE id = $4',
        ['ADMIN', 'APPROVED', hashedPassword, user.id]
      );

      console.log(`✅ User @${user.username} promoted to ADMIN!`);
      console.log(`🔑 Password updated to: ${customPassword}`);
    } else {
      console.log(`User "${target}" not found. Creating new Administrator account...`);
      const hashedPassword = await bcrypt.hash(customPassword, 12);
      const isEmail = target.includes('@');
      const email = isEmail ? target.toLowerCase() : `${target.toLowerCase()}@udhyanagames.com`;
      const username = isEmail ? target.split('@')[0] : target.toLowerCase();
      const id = 'admin_' + Math.random().toString(36).substring(2, 10);

      await pool.query(
        `INSERT INTO "User" (id, email, username, "fullName", password, role, status, rank, "updatedAt") 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [id, email, username, 'Administrator', hashedPassword, 'ADMIN', 'APPROVED', 'Elite']
      );

      console.log(`✅ Created new Administrator account!`);
      console.log(`   - Email: ${email}`);
      console.log(`   - Username / Gamer Tag: ${username}`);
      console.log(`   - Password: ${customPassword}`);
      console.log(`   - Role: ADMIN`);
    }

    console.log(`\nYou can now log in at /reception or /admin with these credentials.\n`);
  } catch (err) {
    if (err.message && err.message.includes('tenant/user') && err.message.includes('not found')) {
      console.error('\n❌ Supabase project appears to be PAUSED or pooler host is unreachable.');
      console.error('👉 Please log into https://supabase.com/dashboard and click "Resume Project" / "Restore".\n');
    } else {
      console.error('\n❌ Error:', err.message || err);
    }
  } finally {
    await pool.end();
  }
}

makeAdmin();

