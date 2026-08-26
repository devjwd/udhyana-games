const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');

let mainWindow = null;

function createWindow() {
  const iconPath = path.join(__dirname, 'app', 'icon.png');

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

  // Load the standalone, bundled Reception Terminal UI directly
  const htmlPath = path.join(__dirname, 'app', 'index.html');
  mainWindow.loadFile(htmlPath);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Block opening external popups
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

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
          marginType: 'none'
        },
        pageSize: options?.pageSize || {
          width: 80000, // 80mm thermal roll in microns
          height: options?.height || 200000
        }
      },
      (success, errorType) => {
        if (!success) console.error('Print failed:', errorType);
        resolve(success);
      }
    );
  });
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
