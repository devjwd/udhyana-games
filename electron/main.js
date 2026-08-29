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
        if (parsed.serverUrl) return parsed;
      }
    } catch (err) {
      console.warn('[Config] Failed to read candidate config path:', p, err);
    }
  }

  return { loadRemoteUrl: false, serverUrl: 'http://localhost:3000/reception' };
}

function getErrorHtml(targetUrl) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Connection Error — Udhyana Games</title>
  <style>
    body {
      background: #08090d;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      text-align: center;
      padding: 20px;
      box-sizing: border-box;
    }
    .card {
      background: #11141c;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 40px;
      max-width: 520px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 1.4rem; margin: 0 0 10px; color: #f43f5e; }
    p { font-size: 0.95rem; color: #94a3b8; line-height: 1.5; margin: 0 0 24px; }
    .url { font-family: monospace; background: rgba(0,0,0,0.4); padding: 4px 8px; border-radius: 4px; color: #38bdf8; word-break: break-all; }
    .btn {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 12px 24px;
      font-size: 0.95rem;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      margin: 6px;
      transition: background 0.2s;
    }
    .btn:hover { background: #2563eb; }
    .btn-secondary { background: #1e293b; color: #94a3b8; }
    .btn-secondary:hover { background: #334155; color: #f8fafc; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🔌</div>
    <h1>Cannot Connect to Server</h1>
    <p>Could not reach the live reception portal at:<br><span class="url">${targetUrl}</span></p>
    <p style="font-size: 0.85rem;">Make sure the Next.js server is started on the local computer, or check your internet connection.</p>
    <div>
      <button class="btn" onclick="location.reload()">Retry Connection</button>
      <button class="btn btn-secondary" onclick="window.location.href='file://${path.join(__dirname, 'app', 'index.html').replace(/\\/g, '/')}'">Open Emergency Offline Terminal</button>
    </div>
  </div>
</body>
</html>`;
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

  // Load dedicated standalone Reception POS Terminal by default
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

  // If remote server connection fails
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    if (validatedURL && validatedURL.startsWith('http')) {
      console.warn(`[Electron] Failed to load ${validatedURL} (${errorCode}: ${errorDescription})`);
      mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(getErrorHtml(validatedURL))}`);
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

// Terminal API Bridge: Communicates with Supabase / Next.js backend
async function callTerminalApi(endpoint, options = {}) {
  const config = loadConfig();
  const baseUrl = config.apiBaseUrl || 'http://localhost:3000';
  const secret = config.terminalSecret || 'super-secret-key-for-next-auth-123';
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
    const { Pool } = require('pg');
    const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || 'postgresql://postgres.phyrzsgkloxdggjjlfba:UdhyanaGamesDb2026%21%23%24@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';
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

ipcMain.handle('terminal:get-config', async () => {
  const config = loadConfig();
  return {
    apiBaseUrl: config.apiBaseUrl || 'http://localhost:3000',
  };
});

ipcMain.handle('terminal:search-members', async (event, query) => {
  // 1. Try local or remote API
  try {
    return await callTerminalApi(`/api/terminal?action=members&q=${encodeURIComponent(query || '')}`);
  } catch (apiErr) {
    console.log('[API Unavailable] Falling back to direct Supabase PostgreSQL query for members...');
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
  // 1. Try API first
  try {
    return await callTerminalApi('/api/terminal?action=catalog-and-live');
  } catch (apiErr) {
    console.log('[API Unavailable] Falling back to direct Supabase PostgreSQL query for live catalog...');
    // 2. Direct Supabase DB Fallback
    try {
      const pool = getDirectDbPool();
      if (!pool) throw apiErr;
      const [consoles, snacks, activeSessions, bookings, baseRateR, extraRateR] = await Promise.all([
        pool.query('SELECT id, "hardwareTitle" AS name, "hardwareSlug" AS type, "hourlyRate" AS rate FROM "Console" ORDER BY id ASC'),
        pool.query('SELECT id, name, price FROM "Snack" ORDER BY name ASC'),
        pool.query(`SELECT s.id, s."consoleId", s."guestName", s."startTime", s."endTime", s.status, s."pausedRemainingSeconds", s."userId", u.username, u."fullName", u.phone
                    FROM "GameSession" s LEFT JOIN "User" u ON s."userId" = u.id
                    WHERE s.status IN ('ACTIVE', 'PAUSED') ORDER BY s."endTime" ASC`),
        pool.query(`SELECT b.id, b."consoleId", c."hardwareTitle" AS "consoleName", b."startTime", b."endTime", u."fullName", u.username, u.phone
                    FROM "Booking" b JOIN "Console" c ON b."consoleId" = c.id JOIN "User" u ON b."userId" = u.id
                    WHERE b.status = 'CONFIRMED' AND b."startTime" >= CURRENT_DATE ORDER BY b."startTime" ASC`),
        pool.query(`SELECT value FROM "Settings" WHERE key = 'baseHourlyRate' LIMIT 1`),
        pool.query(`SELECT value FROM "Settings" WHERE key = 'extraControllerRate' LIMIT 1`),
      ]);

      return {
        success: true,
        baseRate: baseRateR.rows[0]?.value ? parseInt(baseRateR.rows[0].value, 10) : 1000,
        extraControllerRate: extraRateR.rows[0]?.value ? parseInt(extraRateR.rows[0].value, 10) : 200,
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
    } catch (dbErr) {
      console.warn('[DB Error]', dbErr.message);
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
    console.log('[API Unavailable] Falling back to direct Supabase PostgreSQL checkout...');
    // 2. Direct Supabase DB Fallback
    try {
      const pool = getDirectDbPool();
      if (!pool) throw apiErr;
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const { cartItems, totalAmount, paymentMethod = 'cash', sessionData = [], walkInName, walkInPhone, userId: pUserId } = orderPayload;
        let userId = pUserId;
        if (!userId && walkInName && walkInName.trim()) {
          const match = await client.query('SELECT id FROM "User" WHERE username ILIKE $1 OR "fullName" ILIKE $1 LIMIT 1', [walkInName.trim()]);
          if (match.rows.length > 0) userId = match.rows[0].id;
        }

        const orderId = 'ord_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        await client.query(
          'INSERT INTO "Order" (id, "userId", "totalAmount", "paymentMethod", status, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
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
            'INSERT INTO "GameSession" (id, "consoleId", "guestName", "startTime", "endTime", status, "pausedRemainingSeconds", "userId", "createdAt", "updatedAt") VALUES ($1, $2, $3, NOW(), NOW() + make_interval(secs => $4), $5, 0, $6, NOW(), NOW())',
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
    } catch (err) {
      console.warn('[DB Checkout Error]', err.message);
      return { success: false, isOffline: true, error: err.message };
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
    console.log('[API Unavailable] Falling back to direct Supabase PostgreSQL session action...');
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
        await pool.query('UPDATE "GameSession" SET status = $1 WHERE "consoleId" = $2 AND status IN ($3, $4)', ['COMPLETED', consoleId, 'ACTIVE', 'PAUSED']);
        return { success: true };
      }
      return { success: true };
    } catch (err) {
      return { success: false, isOffline: true, error: err.message };
    }
  }
});

// App Lifecycle
app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
