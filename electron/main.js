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

ipcMain.handle('terminal:get-config', async () => {
  const config = loadConfig();
  return {
    apiBaseUrl: config.apiBaseUrl || 'http://localhost:3000',
  };
});

ipcMain.handle('terminal:search-members', async (event, query) => {
  try {
    return await callTerminalApi(`/api/terminal?action=members&q=${encodeURIComponent(query || '')}`);
  } catch (err) {
    return { success: false, isOffline: true, error: err.message, members: [] };
  }
});

ipcMain.handle('terminal:fetch-live', async () => {
  try {
    return await callTerminalApi('/api/terminal?action=catalog-and-live');
  } catch (err) {
    return { success: false, isOffline: true, error: err.message };
  }
});

ipcMain.handle('terminal:checkout', async (event, orderPayload) => {
  try {
    return await callTerminalApi('/api/terminal', {
      method: 'POST',
      body: JSON.stringify({ action: 'CHECKOUT', ...orderPayload }),
    });
  } catch (err) {
    return { success: false, isOffline: true, error: err.message };
  }
});

ipcMain.handle('terminal:session-action', async (event, { action, payload }) => {
  try {
    return await callTerminalApi('/api/terminal', {
      method: 'POST',
      body: JSON.stringify({ action, ...payload }),
    });
  } catch (err) {
    return { success: false, isOffline: true, error: err.message };
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
