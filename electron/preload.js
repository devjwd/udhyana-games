/* eslint-disable @typescript-eslint/no-require-imports */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  platform: process.platform,
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  printReceipt: (options) => ipcRenderer.invoke('print-receipt', options),
});

contextBridge.exposeInMainWorld('terminalAPI', {
  searchMembers: (query) => ipcRenderer.invoke('terminal:search-members', query),
  fetchLiveState: () => ipcRenderer.invoke('terminal:fetch-live'),
  checkoutOrder: (orderPayload) => ipcRenderer.invoke('terminal:checkout', orderPayload),
  sessionAction: (action, payload) => ipcRenderer.invoke('terminal:session-action', { action, payload }),
  getConfig: () => ipcRenderer.invoke('terminal:get-config'),
});
