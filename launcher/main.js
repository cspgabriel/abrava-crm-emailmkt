const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let win;
let procs = {};

const isDev = !app.isPackaged;
const rootDir = isDev 
    ? path.join(__dirname, '..') 
    : path.resolve(path.dirname(process.execPath), '..', '..', '..');

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    frame: true,
    autoHideMenuBar: true,
    backgroundColor: '#0f172a',
    title: 'Abravacom CRM Desktop',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true // HABILITAR WEBVIEW PARA NAVEGAÇÃO INTERNA
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));
  win.once('ready-to-show', () => {
    win.show();
  });
}

app.whenReady().then(createWindow);

ipcMain.handle('start-server', (event, name) => {
  if (procs[name]) return { ok: false, msg: 'Já está em execução' };
  let cwd;
  const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const args = ['run', 'dev'];
  
  if (name === 'crm') cwd = path.join(rootDir, 'crm');
  else if (name === 'site') cwd = path.join(rootDir, 'abravacom-main');

  const fs = require('fs');
  if (!fs.existsSync(cwd)) return { ok: false, msg: `Pasta não encontrada: ${cwd}` };

  try {
    const p = spawn(cmd, args, { cwd, shell: true, env: { ...process.env } });
    procs[name] = p;
    p.stdout.on('data', d => event.sender.send('proc-data', { name, data: d.toString() }));
    p.stderr.on('data', d => event.sender.send('proc-data', { name, data: d.toString() }));
    p.on('error', (err) => {
        event.sender.send('proc-exit', { name, code: -1, msg: err.message });
        delete procs[name];
    });
    p.on('exit', (code) => { 
      delete procs[name]; 
      event.sender.send('proc-exit', { name, code }); 
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, msg: err.message };
  }
});

ipcMain.handle('stop-server', (event, name) => {
  const p = procs[name];
  if (!p) return { ok: false, msg: 'Não está em execução' };
  if (process.platform === 'win32') { spawn('taskkill', ['/pid', p.pid, '/f', '/t']); }
  else { p.kill(); }
  return { ok: true };
});

ipcMain.handle('open-browser', (event, url) => {
  shell.openExternal(url);
  return { ok: true };
});

ipcMain.handle('get-autostart', () => app.getLoginItemSettings().openAtLogin);
ipcMain.handle('set-autostart', (event, value) => {
  app.setLoginItemSettings({ openAtLogin: value });
  return { ok: true };
});

app.on('window-all-closed', () => {
  Object.values(procs).forEach(p => {
    if (process.platform === 'win32') { spawn('taskkill', ['/pid', p.pid, '/f', '/t']); }
    else { p.kill(); }
  });
  app.quit();
});
