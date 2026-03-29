const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let win;
let procs = {};

function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

ipcMain.handle('start-server', (event, name) => {
  if (procs[name]) return { ok: false, msg: 'Already running' };
  let cwd;
  let cmd, args;
  if (name === 'frontend') {
    cwd = path.join(__dirname, '..', 'abravacom-main');
    cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    args = ['run', 'dev'];
  } else if (name === 'api') {
    cwd = path.join(__dirname, '..', 'wpp-api-server');
    cmd = process.execPath; // node
    args = [path.join(cwd, 'server.js')];
  }
  const p = spawn(cmd, args, { cwd, shell: false });
  procs[name] = p;
  p.stdout.on('data', d => event.sender.send('proc-data', { name, data: d.toString() }));
  p.stderr.on('data', d => event.sender.send('proc-data', { name, data: d.toString() }));
  p.on('exit', (code) => { delete procs[name]; event.sender.send('proc-exit', { name, code }); });
  return { ok: true };
});

ipcMain.handle('stop-server', (event, name) => {
  const p = procs[name];
  if (!p) return { ok: false, msg: 'Not running' };
  p.kill();
  return { ok: true };
});

app.on('window-all-closed', () => app.quit());
