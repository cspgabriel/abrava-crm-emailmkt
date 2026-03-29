const { app, BrowserWindow, Menu, shell, Tray } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'CRM Abravacom - Nuvem',
    icon: path.join(__current_dir, 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: true
    },
    // Make it look premium
    autoHideMenuBar: true,
    show: false, // Don't show until ready
    backgroundColor: '#0f172a' // Dark mode background early
  });

  // Load the cloud CRM URL
  mainWindow.loadURL('https://abravacom.com.br/crm');

  // Open external links (if any) in the system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://abravacom.com.br/crm')) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Fade-in or smooth show
  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  // Handle close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Optional: Tray support could be added later if needed.
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.on('ready', () => {
    createWindow();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
}
