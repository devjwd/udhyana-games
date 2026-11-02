/* eslint-disable @typescript-eslint/no-require-imports */
const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

// Single Instance Lock: Ensure only one reception desk terminal is running at a time
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let mainWindow = null;
let currentTargetUrl = '';

function loadConfig() {
  const candidatePaths = [
    path.join(__dirname, '..', 'reception-config.json'),
    path.join(process.resourcesPath || '', 'reception-config.json'),
    path.join(app.getPath('userData'), 'reception-config.json'),
    path.join(process.cwd(), 'reception-config.json'),
  ];

  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed) return parsed;
      }
    } catch (err) {
      console.warn('[Config] Failed to read candidate config path:', p, err);
    }
  }

  return { loadRemoteUrl: false, offlineFirst: true };
}

function createWindow() {
  const iconPath = path.join(__dirname, 'app', 'icon.png');
  const config = loadConfig();
  const htmlPath = path.join(__dirname, 'app', 'index.html');

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'Udhyana Games — Reception Desk Terminal',
    icon: iconPath,
    backgroundColor: '#08090d',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: false,
    },
    show: false,
  });

  // Offline-First: Load dedicated standalone Reception POS Terminal directly
  if (config.loadRemoteUrl && config.serverUrl) {
    currentTargetUrl = config.serverUrl;
    mainWindow.loadURL(currentTargetUrl);
  } else {
    mainWindow.loadFile(htmlPath);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // If remote server connection fails, seamlessly fall back to local offline terminal
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    if (validatedURL && validatedURL.startsWith('http')) {
      console.warn(`[Electron] Remote server unreachable (${errorCode}: ${errorDescription}). Switching to offline-first terminal.`);
      mainWindow.loadFile(htmlPath);
    }
  });

  // Block opening external popups
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  // Prevent staff opening DevTools in production
  mainWindow.webContents.on('before-input-event', (event, input) => {
    const isDev = process.env.ELECTRON_DEV === 'true' || !app.isPackaged;
    if (!isDev) {
      if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
        event.preventDefault();
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Focus existing window if second instance is launched
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// Get installed system printers
ipcMain.handle('get-printers', async () => {
  if (!mainWindow) return [];
  try {
    return await mainWindow.webContents.getPrintersAsync();
  } catch (err) {
    console.error('Failed to get printers:', err);
    return [];
  }
});

// Thermal receipt printing handler via IPC (with silent direct printing support)
ipcMain.handle('print-receipt', async (event, options) => {
  if (!mainWindow) return false;
  return new Promise((resolve) => {
    mainWindow.webContents.print(
      {
        silent: options?.silent ?? false,
        printBackground: true,
        deviceName: options?.deviceName || '',
        margins: {
          marginType: 'none',
        },
        pageSize: options?.pageSize || {
          width: 80000, // 80mm thermal roll in microns
          height: options?.height || 120000, // 120mm default slip to prevent wasting paper roll
        },
      },
      (success, errorType) => {
        if (!success) console.error('Print failed:', errorType);
        resolve(success);
      }
    );
  });
});

let tvWindow = null;
ipcMain.handle('open-tv-screen', async () => {
  if (tvWindow && !tvWindow.isDestroyed()) {
    tvWindow.focus();
    return true;
  }
  const tvHtmlPath = path.join(__dirname, 'app', 'tv.html');

  tvWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 1024,
    minHeight: 600,
    title: 'Udhyana Games — Live Station Arena & Entrance Display',
    backgroundColor: '#08090d',
    autoHideMenuBar: true,
  });

  tvWindow.loadFile(tvHtmlPath);
  tvWindow.on('closed', () => {
    tvWindow = null;
  });
  return true;
});

// Terminal API Bridge: Communicates with Supabase / Next.js backend
async function callTerminalApi(endpoint, options = {}) {
  const config = loadConfig();
  const baseUrl = config.apiBaseUrl || 'http://localhost:3000';
  const secret = config.terminalSecret || process.env.TERMINAL_SECRET || process.env.NEXTAUTH_SECRET || '';
  const url = `${baseUrl}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-terminal-secret': secret,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
  }

  return await res.json();
}

let pgPool = null;
function getDirectDbPool() {
  if (pgPool) return pgPool;
  try {
    const config = loadConfig();
    const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || config.directDbUrl;
    if (!dbUrl) {
      return null;
    }
    const { Pool } = require('pg');
    pgPool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });
    return pgPool;
  } catch (err) {
    console.warn('[Direct DB] pg client initialization error:', err.message);
    return null;
  }
}

// =========================================================
// LOCAL DATABASE & OFFLINE-FIRST ENGINE
// =========================================================
const LOCAL_DB_DIR = path.join(__dirname, '..', 'local_database');
const LOCAL_TERMINAL_PATH = path.join(LOCAL_DB_DIR, 'terminal_state.json');
const LOCAL_QUEUE_PATH = path.join(LOCAL_DB_DIR, 'offline_sync_queue.json');

function ensureLocalDbFiles() {
  if (!fs.existsSync(LOCAL_DB_DIR)) fs.mkdirSync(LOCAL_DB_DIR, { recursive: true });
  if (!fs.existsSync(LOCAL_QUEUE_PATH)) fs.writeFileSync(LOCAL_QUEUE_PATH, '[]', 'utf8');
}

function readLocalTerminalState() {
  ensureLocalDbFiles();
  try {
    if (fs.existsSync(LOCAL_TERMINAL_PATH)) {
      return JSON.parse(fs.readFileSync(LOCAL_TERMINAL_PATH, 'utf8'));
    }
  } catch (err) {
    console.warn('[Local DB] Error reading terminal_state.json:', err.message);
  }
  return null;
}

function writeLocalTerminalState(data) {
  ensureLocalDbFiles();
  try {
    fs.writeFileSync(LOCAL_TERMINAL_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.warn('[Local DB] Error saving terminal_state.json:', err.message);
    return false;
  }
}

function appendToOfflineQueue(action) {
  ensureLocalDbFiles();
  try {
    let queue = [];
    if (fs.existsSync(LOCAL_QUEUE_PATH)) {
      queue = JSON.parse(fs.readFileSync(LOCAL_QUEUE_PATH, 'utf8') || '[]');
    }
    queue.push({
      id: 'off_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      ...action,
      timestamp: new Date().toISOString()
    });
    fs.writeFileSync(LOCAL_QUEUE_PATH, JSON.stringify(queue, null, 2), 'utf8');
    console.log(`[Local DB] Enqueued offline action: ${action.type}`);
  } catch (err) {
    console.warn('[Local DB] Error appending to offline queue:', err.message);
  }
}

async function flushOfflineQueueIfOnline() {
  try {
    const pool = getDirectDbPool();
    if (!pool) return;
    if (!fs.existsSync(LOCAL_QUEUE_PATH)) return;
    const raw = fs.readFileSync(LOCAL_QUEUE_PATH, 'utf8');
    const queue = JSON.parse(raw || '[]');
    if (queue.length === 0) return;

    console.log(`[Auto-Sync] Flushing ${queue.length} offline actions to Supabase cloud...`);
    const remaining = [];
    for (const item of queue) {
      try {
        if (item.type === 'CHECKOUT' || item.type === 'session_start') {
          const { cartItems, totalAmount, paymentMethod = 'cash', sessionData = [], walkInName, userId } = item.payload || {};
          const orderId = 'ord_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
          const orderCreated = item.payload?.createdAt ? new Date(item.payload.createdAt) : new Date(item.timestamp || Date.now());
          
          await pool.query(
            'INSERT INTO "Order" (id, "userId", "totalAmount", "paymentMethod", status, "createdAt") VALUES ($1, $2, $3, $4, $5, $6)',
            [orderId, userId || null, Number(totalAmount) || 0, paymentMethod, 'COMPLETED', orderCreated]
          );
          for (const it of (cartItems || [])) {
            const itemId = 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            await pool.query(
              'INSERT INTO "OrderItem" (id, "orderId", name, price, type, quantity) VALUES ($1, $2, $3, $4, $5, $6)',
              [itemId, orderId, it.name || 'Order Item', Number(it.price) || 0, it.type || 'session', Number(it.quantity) || 1]
            );
          }
          for (const s of sessionData) {
            const sessId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            const sessStart = s.startTime ? new Date(s.startTime) : orderCreated;
            const durSec = Number(s.durationSeconds) || (Number(s.durationHours) * 3600) || 3600;
            const sessEnd = s.endTime ? new Date(s.endTime) : new Date(sessStart.getTime() + durSec * 1000);
            const isStillActive = sessEnd.getTime() > Date.now();
            const sessStatus = isStillActive ? 'ACTIVE' : 'COMPLETED';

            await pool.query(
              'INSERT INTO "GameSession" (id, "consoleId", "guestName", "startTime", "endTime", status, "pausedRemainingSeconds", "userId", "checkedOutAt") VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8)',
              [sessId, s.consoleId, s.playerName || walkInName || 'Guest', sessStart, sessEnd, sessStatus, userId || null, isStillActive ? null : sessEnd]
            );
          }
        } else if (item.type === 'session_end') {
          const { consoleId, endedAt } = item.payload || {};
          const checkoutTime = new Date(endedAt || item.timestamp || Date.now());
          await pool.query(
            'UPDATE "GameSession" SET status = $1, "checkedOutAt" = $2 WHERE "consoleId" = $3 AND status IN (\'ACTIVE\', \'PAUSED\')',
            ['COMPLETED', checkoutTime, consoleId]
          );
        } else if (item.type === 'session_action') {
          const { action, consoleId, remainingSeconds } = item.payload || {};
          if (action === 'PAUSE') {
            await pool.query(
              'UPDATE "GameSession" SET status = $1, "pausedRemainingSeconds" = $2 WHERE "consoleId" = $3 AND status = $4',
              ['PAUSED', Number(remainingSeconds) || 60, consoleId, 'ACTIVE']
            );
          } else if (action === 'RESUME') {
            const s = await pool.query('SELECT "pausedRemainingSeconds" FROM "GameSession" WHERE "consoleId" = $1 AND status = $2', [consoleId, 'PAUSED']);
            const sec = s.rows[0]?.pausedRemainingSeconds || 60;
            await pool.query(
              'UPDATE "GameSession" SET status = $1, "endTime" = NOW() + make_interval(secs => $2), "pausedRemainingSeconds" = 0 WHERE "consoleId" = $3 AND status = $4',
              ['ACTIVE', sec, consoleId, 'PAUSED']
            );
          }
        } else if (item.type === 'add_time') {
          const { consoleId, additionalSeconds } = item.payload || {};
          await pool.query(
            'UPDATE "GameSession" SET "endTime" = "endTime" + make_interval(secs => $1) WHERE "consoleId" = $2 AND status IN (\'ACTIVE\', \'PAUSED\')',
            [Number(additionalSeconds) || 0, consoleId]
          );
        } else {
          // Keep unhandled item types in queue so they are not silently lost
          remaining.push(item);
        }
      } catch (flushErr) {
        console.warn(`[Auto-Sync] Error flushing item ${item.id}:`, flushErr.message);
        remaining.push(item);
      }
    }
    fs.writeFileSync(LOCAL_QUEUE_PATH, JSON.stringify(remaining, null, 2), 'utf8');
  } catch (err) {
    console.warn('[Auto-Sync] Batch flush error:', err.message);
  }
}

// IPC Handlers for Local Database
ipcMain.handle('terminal:get-local-db-path', () => LOCAL_DB_DIR);

ipcMain.handle('terminal:load-local-state', () => {
  return readLocalTerminalState();
});

ipcMain.handle('terminal:save-local-state', (event, data) => {
  return writeLocalTerminalState(data);
});

ipcMain.handle('terminal:get-config', async () => {
  const config = loadConfig();
  return {
    apiBaseUrl: config.apiBaseUrl || 'http://localhost:3000',
    localDbDir: LOCAL_DB_DIR
  };
});

ipcMain.handle('terminal:search-members', async (event, query) => {
  // 1. Try local or remote API
  try {
    return await callTerminalApi(`/api/terminal?action=members&q=${encodeURIComponent(query || '')}`);
  } catch (apiErr) {
    // 2. Direct Supabase DB Fallback
    try {
      const pool = getDirectDbPool();
      if (!pool) throw apiErr;
      const q = `%${(query || '').trim()}%`;
      const r = await pool.query(
        `SELECT id, username, "fullName", phone, rank, "loyaltyPoints", "playtimeHours", "sessionsCount"
         FROM "User"
         WHERE username ILIKE $1 OR "fullName" ILIKE $1 OR phone ILIKE $1
         ORDER BY "loyaltyPoints" DESC LIMIT 10`,
        [q]
      );
      return { success: true, members: r.rows };
    } catch (dbErr) {
      console.warn('[DB Error]', dbErr.message);
      return { success: false, isOffline: true, error: dbErr.message, members: [] };
    }
  }
});

ipcMain.handle('terminal:fetch-live', async () => {
  // Check if we should flush offline queue first
  await flushOfflineQueueIfOnline();

  // 1. Try API first
  try {
    const liveData = await callTerminalApi('/api/terminal?action=catalog-and-live');
    if (liveData && liveData.success) {
      writeLocalTerminalState(liveData);
      return liveData;
    }
  } catch (apiErr) {
    // 2. Direct Supabase DB Fallback
    try {
      const pool = getDirectDbPool();
      if (!pool) throw apiErr;
      const [consoles, snacks, activeSessions, bookings, baseRateR, extraRateR] = await Promise.all([
        pool.query(`SELECT c.id, c."hardwareTitle" AS name, c."hardwareSlug" AS type, c."hourlyRate" AS rate,
                           COALESCE(array_agg(g.name) FILTER (WHERE g.name IS NOT NULL), '{}') AS games
                    FROM "Console" c
                    LEFT JOIN "ConsoleGames" cg ON c.id = cg."consoleId"
                    LEFT JOIN "Game" g ON cg."gameId" = g.id
                    GROUP BY c.id
                    ORDER BY c.id ASC`),
        pool.query('SELECT id, name, price FROM "Snack" ORDER BY name ASC'),
        pool.query(`SELECT s.id, s."consoleId", s."guestName", s."startTime", s."endTime", s.status, s."pausedRemainingSeconds", s."billingType", s."extraControllers", s."userId", u.username, u."fullName", u.phone
                    FROM "GameSession" s LEFT JOIN "User" u ON s."userId" = u.id
                    WHERE s.status IN ('ACTIVE', 'PAUSED') ORDER BY s."endTime" ASC`),
        pool.query(`SELECT b.id, b."consoleId", c."hardwareTitle" AS "consoleName", b."startTime", b."endTime", u."fullName", u.username, u.phone
                    FROM "Booking" b JOIN "Console" c ON b."consoleId" = c.id JOIN "User" u ON b."userId" = u.id
                    WHERE b.status = 'CONFIRMED' AND b."startTime" >= CURRENT_DATE ORDER BY b."startTime" ASC`),
        pool.query(`SELECT value FROM "Settings" WHERE key = 'baseHourlyRate' LIMIT 1`),
        pool.query(`SELECT value FROM "Settings" WHERE key = 'extraControllerRate' LIMIT 1`),
      ]);

      const liveResult = {
        success: true,
        baseRate: baseRateR.rows[0]?.value ? parseInt(baseRateR.rows[0].value, 10) : 300,
        extraControllerRate: extraRateR.rows[0]?.value ? parseInt(extraRateR.rows[0].value, 10) : 100,
        consoles: consoles.rows,
        snacks: snacks.rows,
        activeSessions: activeSessions.rows.map(s => ({
          id: s.id,
          consoleId: s.consoleId,
          playerName: s.guestName || s.fullName || s.username || 'Guest',
          phone: s.phone,
          userId: s.userId,
          startTime: s.startTime?.toISOString ? s.startTime.toISOString() : s.startTime,
          endTime: s.endTime?.toISOString ? s.endTime.toISOString() : s.endTime,
          status: s.status,
          pausedRemainingSeconds: s.pausedRemainingSeconds || 0,
          billingType: s.billingType || 'PREPAID',
          extraControllers: s.extraControllers || 0,
        })),
        upcomingBookings: bookings.rows.map(b => ({
          id: b.id,
          consoleId: b.consoleId,
          consoleName: b.consoleName,
          playerName: b.fullName || b.username || 'Reserved Player',
          phone: b.phone,
          startTime: b.startTime?.toISOString ? b.startTime.toISOString() : b.startTime,
          endTime: b.endTime?.toISOString ? b.endTime.toISOString() : b.endTime,
        })),
      };

      writeLocalTerminalState(liveResult);
      return liveResult;
    } catch (dbErr) {
      console.warn('[DB Error] Operating in 100% Offline Mode. Reading from local_database/ directory...');
      // 3. Fallback to local_database/ folder
      const cached = readLocalTerminalState();
      if (cached) {
        return { ...cached, isOffline: true, fromLocalDb: true };
      }
      return { success: false, isOffline: true, error: dbErr.message };
    }
  }
});

ipcMain.handle('terminal:checkout', async (event, orderPayload) => {
  // 1. Try API first
  try {
    return await callTerminalApi('/api/terminal', {
      method: 'POST',
      body: JSON.stringify({ action: 'CHECKOUT', ...orderPayload }),
    });
  } catch (apiErr) {
    // 2. Direct Supabase DB Fallback
    try {
      const pool = getDirectDbPool();
      if (!pool) throw apiErr;
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const { cartItems, totalAmount, paymentMethod = 'cash', sessionData = [], walkInName, userId: pUserId } = orderPayload;
        let userId = pUserId;
        if (!userId && walkInName && walkInName.trim()) {
          const match = await client.query('SELECT id FROM "User" WHERE username ILIKE $1 OR "fullName" ILIKE $1 LIMIT 1', [walkInName.trim()]);
          if (match.rows.length > 0) userId = match.rows[0].id;
        }

        const orderId = 'ord_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        await client.query(
          'INSERT INTO "Order" (id, "userId", "totalAmount", "paymentMethod", status, "createdAt") VALUES ($1, $2, $3, $4, $5, NOW())',
          [orderId, userId || null, totalAmount, paymentMethod, 'COMPLETED']
        );

        for (const it of (cartItems || [])) {
          const itemId = 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
          await client.query(
            'INSERT INTO "OrderItem" (id, "orderId", name, price, type, quantity) VALUES ($1, $2, $3, $4, $5, $6)',
            [itemId, orderId, it.name, it.price, it.type || 'session', it.quantity || 1]
          );
        }

        for (const s of sessionData) {
          const sessId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
          const durSec = Number(s.durationSeconds) || (Number(s.durationHours) * 3600) || 3600;
          await client.query(
            'INSERT INTO "GameSession" (id, "consoleId", "guestName", "startTime", "endTime", status, "pausedRemainingSeconds", "userId") VALUES ($1, $2, $3, NOW(), NOW() + make_interval(secs => $4), $5, 0, $6)',
            [sessId, s.consoleId, s.playerName || walkInName || 'Guest', durSec, 'ACTIVE', userId || null]
          );
        }

        let updatedProfile = null;
        if (userId) {
          const pts = Math.floor(totalAmount / 10);
          const uRes = await client.query(
            'UPDATE "User" SET "loyaltyPoints" = COALESCE("loyaltyPoints", 0) + $1, "sessionsCount" = COALESCE("sessionsCount", 0) + $2, "playtimeHours" = COALESCE("playtimeHours", 0) + $3 WHERE id = $4 RETURNING "loyaltyPoints", rank, "playtimeHours"',
            [pts, sessionData.length, Math.max(1, sessionData.length), userId]
          );
          if (uRes.rows[0]) updatedProfile = uRes.rows[0];
        }

        await client.query('COMMIT');
        return { success: true, orderId, totalAmount, updatedProfile };
      } catch (dbErr) {
        await client.query('ROLLBACK');
        throw dbErr;
      } finally {
        client.release();
      }
    } catch {
      console.warn('[DB Checkout Offline] Appending to local_database/offline_sync_queue.json...');
      // 3. Save to local_database/ offline queue
      const orderId = 'off_ord_' + Date.now();
      appendToOfflineQueue({
        type: 'CHECKOUT',
        payload: orderPayload
      });
      return { success: true, isOffline: true, queuedInLocalDb: true, orderId, totalAmount: orderPayload.totalAmount };
    }
  }
});

ipcMain.handle('terminal:session-action', async (event, { action, payload }) => {
  // 1. Try API first
  try {
    return await callTerminalApi('/api/terminal', {
      method: 'POST',
      body: JSON.stringify({ action, ...payload }),
    });
  } catch (apiErr) {
    try {
      const pool = getDirectDbPool();
      if (!pool) throw apiErr;

      if (action === 'PAUSE') {
        const { consoleId, remainingSeconds } = payload;
        await pool.query('UPDATE "GameSession" SET status = $1, "pausedRemainingSeconds" = $2 WHERE "consoleId" = $3 AND status = $4', ['PAUSED', remainingSeconds || 60, consoleId, 'ACTIVE']);
        return { success: true };
      } else if (action === 'RESUME') {
        const { consoleId } = payload;
        const s = await pool.query('SELECT "pausedRemainingSeconds" FROM "GameSession" WHERE "consoleId" = $1 AND status = $2', [consoleId, 'PAUSED']);
        const sec = s.rows[0]?.pausedRemainingSeconds || 60;
        await pool.query('UPDATE "GameSession" SET status = $1, "endTime" = NOW() + make_interval(secs => $2), "pausedRemainingSeconds" = 0 WHERE "consoleId" = $3 AND status = $4', ['ACTIVE', sec, consoleId, 'PAUSED']);
        return { success: true };
      } else if (action === 'END') {
        const { consoleId } = payload;
        await pool.query('UPDATE "GameSession" SET status = $1, "checkedOutAt" = NOW() WHERE "consoleId" = $2 AND status IN ($3, $4)', ['COMPLETED', consoleId, 'ACTIVE', 'PAUSED']);
        return { success: true };
      } else if (action === 'START_POSTPAID') {
        const { consoleId, guestName, userId, extraControllers } = payload;
        const sId = 'sess_' + Date.now();
        await pool.query(
          'INSERT INTO "GameSession" (id, "consoleId", "guestName", "startTime", "endTime", status, "pausedRemainingSeconds", "billingType", "extraControllers", "userId") VALUES ($1, $2, $3, NOW(), NOW() + interval \'24 hours\', \'ACTIVE\', 0, \'POSTPAID\', $4, $5)',
          [sId, consoleId, guestName || 'Guest', Number(extraControllers) || 0, userId || null]
        );
        return { success: true, sessionId: sId };
      }
      return { success: true };
    } catch {
      console.warn('[Session Action Offline] Queued locally in local_database/');
      appendToOfflineQueue({
        type: action === 'END' ? 'session_end' : 'session_action',
        payload
      });
      return { success: true, isOffline: true, queuedInLocalDb: true };
    }
  }
});

// App Lifecycle
app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();

  // Periodically check and flush offline queue every 30 seconds
  setInterval(flushOfflineQueueIfOnline, 30000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

