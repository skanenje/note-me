const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Documents
  createDocument: (title) => ipcRenderer.invoke('create-document', title),
  getDocuments: () => ipcRenderer.invoke('get-documents'),
  getDocumentWithBlocks: (documentId) => ipcRenderer.invoke('get-document-with-blocks', documentId),
  updateDocumentTitle: (data) => ipcRenderer.invoke('update-document-title', data),
  
  // Blocks
  createBlock: (data) => ipcRenderer.invoke('create-block', data),
  updateBlock: (data) => ipcRenderer.invoke('update-block', data),
  deleteBlock: (blockId) => ipcRenderer.invoke('delete-block', blockId),
  
  // Mutations
  getAllMutations: (limit) => ipcRenderer.invoke('get-all-mutations', limit),
  getUnsyncedMutations: () => ipcRenderer.invoke('get-unsynced-mutations'),
  markMutationsSynced: (mutationIds) => ipcRenderer.invoke('mark-mutations-synced', mutationIds)
});
