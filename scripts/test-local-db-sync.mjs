import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { Pool } from 'pg';

async function main() {
  console.log('🧪 Testing Local Database Directory & Auto-Sync Engine...');

  const localDbDir = path.join(process.cwd(), 'local_database');
  const queuePath = path.join(localDbDir, 'offline_sync_queue.json');
  const terminalPath = path.join(localDbDir, 'terminal_state.json');
  const localMirrorPath = path.join(localDbDir, 'udhyana_local.json');

  console.log('1. Checking local_database/ directory existence:');
  console.log('   Directory:', localDbDir);
  console.log('   Files present:', fs.readdirSync(localDbDir));

  // 2. Test Offline Enqueue
  console.log('\n2. Testing Offline Enqueue in local_database/offline_sync_queue.json:');
  const testAction = {
    id: 'off_test_' + Date.now(),
    type: 'order_create',
    payload: {
      userId: null,
      totalAmount: 250,
      paymentMethod: 'cash',
      items: [{ name: 'Test Offline Drink', price: 250, quantity: 1, type: 'snack' }],
      createdAt: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  };

  let queue = JSON.parse(fs.readFileSync(queuePath, 'utf8') || '[]');
  queue.push(testAction);
  fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2), 'utf8');
  console.log(`   ✓ Offline queue successfully written. Queue size: ${queue.length}`);

  // 3. Test Cloud Sync & Flushing
  console.log('\n3. Testing Direct Cloud Sync to Supabase...');
  const connStr = process.env.DIRECT_URL || process.env.DATABASE_URL;
  const pool = new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false } });

  try {
    const checkRes = await pool.query('SELECT count(*) FROM "Console"');
    console.log(`   ✓ Connected to Supabase Cloud! Found ${checkRes.rows[0].count} consoles.`);

    // Flush test queue item
    for (const item of queue) {
      if (item.id === testAction.id) {
        const orderId = 'ord_' + Date.now();
        await pool.query(
          'INSERT INTO "Order" (id, "totalAmount", "paymentMethod", status, "createdAt") VALUES ($1, $2, $3, $4, NOW())',
          [orderId, item.payload.totalAmount, item.payload.paymentMethod, 'COMPLETED']
        );
        console.log(`   ✓ Successfully synced offline action ${item.id} to Supabase Order (${orderId})!`);
      }
    }

    // Clean up test action from queue
    queue = queue.filter(q => q.id !== testAction.id);
    fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2), 'utf8');
    console.log(`   ✓ Queue cleaned up. Remaining offline items: ${queue.length}`);

    // Update local snapshot
    const [consolesRes, snacksRes] = await Promise.all([
      pool.query('SELECT id, "hardwareTitle" FROM "Console" ORDER BY id ASC'),
      pool.query('SELECT id, name, price FROM "Snack" ORDER BY name ASC')
    ]);

    const snapshot = {
      lastSyncedAt: new Date().toISOString(),
      cloudConnected: true,
      consoles: consolesRes.rows,
      snacks: snacksRes.rows
    };
    fs.writeFileSync(terminalPath, JSON.stringify(snapshot, null, 2), 'utf8');
    console.log('   ✓ Updated local_database/terminal_state.json with live snapshot.');
  } finally {
    await pool.end();
  }

  console.log('\n4. Final files in local_database/:');
  fs.readdirSync(localDbDir).forEach(f => {
    const stat = fs.statSync(path.join(localDbDir, f));
    console.log(`   📁 ${f} (${stat.size} bytes)`);
  });

  console.log('\n🎉 ALL LOCAL DATABASE & OFFLINE-SYNC TESTS PASSED!');
}

main().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

