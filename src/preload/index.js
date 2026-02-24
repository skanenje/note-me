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

  // Lessons (LMS)
  getLessons: () => ipcRenderer.invoke('lessons:get-all'),
  getLessonWithBlocks: (lessonId) => ipcRenderer.invoke('lessons:get-with-blocks', lessonId),
  updateProgress: (data) => ipcRenderer.invoke('lessons:update-progress', data),
  getLessonProgress: (lessonId) => ipcRenderer.invoke('lessons:get-progress', lessonId),
});

// Separate API for Electron-specific features (tab management)
// Whitelist of allowed invoke channels for security
const ALLOWED_INVOKE_CHANNELS = new Set([
  'prompt-enhancer:get-frameworks',
  'prompt-enhancer:enhance',
]);

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  createTab: (sessionId, toolUrl) => {
    ipcRenderer.send('create-tab', { sessionId, toolUrl });
  },
  switchTab: (sessionId) => {
    ipcRenderer.send('switch-tab', sessionId);
  },
  closeTab: (sessionId) => {
    ipcRenderer.send('close-tab', sessionId);
  },
  navigateView: (viewName) => {
    ipcRenderer.send('navigate-view', viewName);
  },
  onTabCreated: (callback) => {
    ipcRenderer.on('tab-created', (event, sessionId) => callback(sessionId));
  },
  onTabSwitched: (callback) => {
    ipcRenderer.on('tab-switched', (event, sessionId) => callback(sessionId));
  },
  onTabClosed: (callback) => {
    ipcRenderer.on('tab-closed', (event, sessionId) => callback(sessionId));
  },
  // Safe invoke wrapper with whitelisted channels
  invoke: (channel, data) => {
    if (!ALLOWED_INVOKE_CHANNELS.has(channel)) {
      throw new Error(`IPC channel "${channel}" is not allowed`);
    }
    return ipcRenderer.invoke(channel, data);
  }
});
