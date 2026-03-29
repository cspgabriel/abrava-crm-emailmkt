const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  startServer: (name) => ipcRenderer.invoke('start-server', name),
  stopServer: (name) => ipcRenderer.invoke('stop-server', name),
  onProcData: (cb) => ipcRenderer.on('proc-data', (e, d) => cb(d)),
  onProcExit: (cb) => ipcRenderer.on('proc-exit', (e, d) => cb(d))
});
