const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  startServer: (name) => ipcRenderer.invoke('start-server', name),
  stopServer: (name) => ipcRenderer.invoke('stop-server', name),
  openBrowser: (url) => ipcRenderer.invoke('open-browser', url),
  openUrlWindow: (url, title) => ipcRenderer.invoke('open-url-window', { url, title }),
  getAutoStart: () => ipcRenderer.invoke('get-autostart'),
  setAutoStart: (val) => ipcRenderer.invoke('set-autostart', val),
  onProcData: (cb) => ipcRenderer.on('proc-data', (e, d) => cb(d)),
  onProcExit: (cb) => ipcRenderer.on('proc-exit', (e, d) => cb(d))
});
