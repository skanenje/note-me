const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  createDocument: (title) => ipcRenderer.invoke('create-document', title),
  getDocuments: () => ipcRenderer.invoke('get-documents')
});