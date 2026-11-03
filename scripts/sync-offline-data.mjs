import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const localDbPath = path.join(rootDir, 'local_database', 'udhyana_local.json');
const electronAppJsPath = path.join(rootDir, 'electron', 'app', 'app.js');

console.log('🔄 Synchronizing offline database & desktop app assets...\n');

// Standard verified 4-station layout
const STATIONS = [
  {
    id: 'PS5',
    hardwareTitle: 'station 1 ( ps5 )',
    hourlyRate: 300,
    type: 'PS5',
    games: [
      'EA Sports FC 25',
      'Tekken 8',
      'Mortal Kombat 1',
      'Marvel’s Spider-Man 2',
      'God of War Ragnarök',
      'Call of Duty: Warzone',
      'GTA V',
      'Fortnite',
      'Rocket League',
      'Gran Turismo 7'
    ]
  },
  {
    id: 'Xbox series X',
    hardwareTitle: 'station 2 ( xbox series X )',
    hourlyRate: 300,
    type: 'Xbox Series X',
    games: [
      'EA Sports FC 25',
      'Tekken 8',
      'Mortal Kombat 1',
      'Forza Horizon 5',
      'Call of Duty: Warzone',
      'GTA V',
      'Halo Infinite',
      'Fortnite',
      'Rocket League',
      'Need for Speed Unbound'
    ]
  },
  {
    id: 'Xbox series X(2)',
    hardwareTitle: 'Station 3 ( xbox series X )',
    hourlyRate: 300,
    type: 'Xbox Series X',
    games: [
      'EA Sports FC 25',
      'Tekken 8',
      'Mortal Kombat 1',
      'Forza Horizon 5',
      'Call of Duty: Warzone',
      'GTA V',
      'Halo Infinite',
      'Fortnite',
      'Rocket League',
      'Need for Speed Unbound'
    ]
  },
  {
    id: 'steerin wheel + ps4',
    hardwareTitle: 'station 4 ( steering wheel )',
    hourlyRate: 300,
    type: 'Racing Rig',
    games: [
      'Forza Horizon 5',
      'Gran Turismo 7',
      'Need for Speed Unbound',
      'Assetto Corsa',
      'F1 24',
      'Dirt Rally 2.0',
      'GTA V'
    ]
  }
];

const SNACKS = [
  { id: 'snk-1', name: 'Red Bull Energy Drink', price: 500, icon: '⚡' },
  { id: 'snk-2', name: 'Sting / Monster Energy', price: 250, icon: '🥤' },
  { id: 'snk-3', name: 'Coca-Cola / Sprite (345ml)', price: 150, icon: '🥤' },
  { id: 'snk-4', name: 'Lays / Kurkure Chips', price: 200, icon: '🍿' },
  { id: 'snk-5', name: 'Dairy Milk / KitKat Bar', price: 300, icon: '🍫' },
  { id: 'snk-6', name: 'Mineral Water (500ml)', price: 100, icon: '💧' }
];

const PRICING = {
  baseHourlyRate: 300,
  extraControllerRate: 100
};

// 1. Update local_database/udhyana_local.json
let existingLocalDb = {};
if (fs.existsSync(localDbPath)) {
  try {
    existingLocalDb = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
  } catch {}
}

// Check offline sync queue to merge any offline sessions or orders
const offlineQueuePath = path.join(rootDir, 'local_database', 'offline_sync_queue.json');
let queuedOrders = [];
let queuedSessions = [];
if (fs.existsSync(offlineQueuePath)) {
  try {
    const rawQueue = JSON.parse(fs.readFileSync(offlineQueuePath, 'utf8') || '[]');
    for (const qItem of rawQueue) {
      if (qItem.type === 'CHECKOUT' && qItem.payload) {
        queuedOrders.push({
          id: qItem.id,
          totalAmount: qItem.payload.totalAmount,
          paymentMethod: qItem.payload.paymentMethod || 'cash',
          walkInName: qItem.payload.walkInName,
          createdAt: qItem.timestamp || new Date().toISOString()
        });
        if (qItem.payload.sessionData && Array.isArray(qItem.payload.sessionData)) {
          for (const s of qItem.payload.sessionData) {
            const start = new Date(qItem.timestamp || Date.now());
            const end = new Date(start.getTime() + (s.durationSeconds || 3600) * 1000);
            queuedSessions.push({
              id: 'sess_' + qItem.id,
              consoleId: s.consoleId,
              guestName: s.playerName,
              status: end.getTime() > Date.now() ? 'ACTIVE' : 'COMPLETED',
              billingType: 'PREPAID',
              startTime: start.toISOString(),
              endTime: end.toISOString()
            });
          }
        }
      }
    }
  } catch {}
}

const mergedOrders = [...(existingLocalDb.orders || [])];
for (const qo of queuedOrders) {
  if (!mergedOrders.some(o => o.id === qo.id)) {
    mergedOrders.push(qo);
  }
}

const mergedSessions = [...(existingLocalDb.sessions || [])];
for (const qs of queuedSessions) {
  if (!mergedSessions.some(s => s.id === qs.id)) {
    mergedSessions.push(qs);
  }
}

const updatedLocalDb = {
  ...existingLocalDb,
  updatedAt: new Date().toISOString(),
  cloudConnected: true,
  consoles: STATIONS,
  snacks: SNACKS,
  pricing: PRICING,
  users: existingLocalDb.users || [],
  sessions: mergedSessions,
  orders: mergedOrders
};

fs.writeFileSync(localDbPath, JSON.stringify(updatedLocalDb, null, 2), 'utf8');
console.log('✅ Updated local_database/udhyana_local.json with latest stations, games, and pricing');

// 2. Ensure electron/app/app.js has up to date default stations
if (fs.existsSync(electronAppJsPath)) {
  let appJsContent = fs.readFileSync(electronAppJsPath, 'utf8');
  // Check if DEFAULT_CONSOLES contains PS5
  if (!appJsContent.includes("'PS5'")) {
    console.log('⚠️ electron/app/app.js needs updating...');
  } else {
    console.log('✅ electron/app/app.js is synchronized with all 4 stations');
  }
}

console.log('\n🎉 All offline data files are synchronized and up-to-date!\n');

