const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Documents
  createDocument: (data) => ipcRenderer.invoke('create-document', data),
  getDocuments: () => ipcRenderer.invoke('get-documents'),
  getDocumentTree: () => ipcRenderer.invoke('get-document-tree'),
  getFavorites: () => ipcRenderer.invoke('get-favorites'),
  getTrash: () => ipcRenderer.invoke('get-trash'),
  getDocumentWithBlocks: (documentId) => ipcRenderer.invoke('get-document-with-blocks', documentId),
  updateDocumentTitle: (data) => ipcRenderer.invoke('update-document-title', data),
  updateDocumentMeta: (data) => ipcRenderer.invoke('update-document-meta', data),
  toggleFavorite: (documentId) => ipcRenderer.invoke('toggle-favorite', documentId),
  trashDocument: (documentId) => ipcRenderer.invoke('trash-document', documentId),
  restoreDocument: (documentId) => ipcRenderer.invoke('restore-document', documentId),
  deleteDocument: (documentId) => ipcRenderer.invoke('delete-document', documentId),

  // Blocks
  createBlock: (data) => ipcRenderer.invoke('create-block', data),
  updateBlock: (data) => ipcRenderer.invoke('update-block', data),
  updateBlockType: (data) => ipcRenderer.invoke('update-block-type', data),
  moveBlock: (data) => ipcRenderer.invoke('move-block', data),
  updateBlockIndent: (data) => ipcRenderer.invoke('update-block-indent', data),
  deleteBlock: (blockId) => ipcRenderer.invoke('delete-block', blockId),

  // Lessons (LMS)
  getLessons: () => ipcRenderer.invoke('lessons:get-all'),
  getLessonWithBlocks: (lessonId) => ipcRenderer.invoke('lessons:get-with-blocks', lessonId),
  updateProgress: (data) => ipcRenderer.invoke('lessons:update-progress', data),
  getLessonProgress: (lessonId) => ipcRenderer.invoke('lessons:get-progress', lessonId),
  executeCode: (data) => ipcRenderer.invoke('lessons:execute-code', data),

  // Prompt Enhancer
  getFrameworks: () => ipcRenderer.invoke('prompt-enhancer:get-frameworks'),
  enhancePrompt: (data) => ipcRenderer.invoke('prompt-enhancer:enhance', data),
  getPromptHistory: (limit) => ipcRenderer.invoke('prompt-enhancer:get-history', limit),
  deletePromptHistory: (id) => ipcRenderer.invoke('prompt-enhancer:delete-history', id),

  // AI Tools
  getTools: () => ipcRenderer.invoke('tools:get-all'),
  getSessions: () => ipcRenderer.invoke('tools:get-sessions'),
  createSession: (toolId) => ipcRenderer.invoke('tools:create-session', { tool_id: toolId }),
  updateSessionActivity: (sessionId) => ipcRenderer.invoke('tools:update-session-activity', sessionId),
  deleteSession: (sessionId) => ipcRenderer.invoke('tools:delete-session', sessionId),
  setSessionPinned: (sessionId, pinned) => ipcRenderer.invoke('tools:set-session-pinned', { sessionId, pinned }),
});

// Separate API for Electron-specific features (tab management)
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,

  // Tab lifecycle
  createTab: (sessionId, toolUrl) => {
    ipcRenderer.send('create-tab', { sessionId, toolUrl });
  },
  switchTab: (sessionId) => {
    ipcRenderer.send('switch-tab', sessionId);
  },
  closeTab: (sessionId) => {
    ipcRenderer.send('close-tab', sessionId);
  },
  hideTabs: () => {
    ipcRenderer.send('hide-tabs');
  },
  showTabs: () => {
    ipcRenderer.send('show-tabs');
  },

  // Layout: tell the main process where the BrowserView should be rendered
  updateLayoutMetrics: (sidebarWidth, toolbarHeight) => {
    ipcRenderer.send('update-layout-metrics', { sidebarWidth, toolbarHeight });
  },

  // Listeners
  onTabCreated: (callback) => {
    ipcRenderer.on('tab-created', (event, sessionId) => callback(sessionId));
  },
  onTabSwitched: (callback) => {
    ipcRenderer.on('tab-switched', (event, sessionId) => callback(sessionId));
  },
  onTabClosed: (callback) => {
    ipcRenderer.on('tab-closed', (event, sessionId) => callback(sessionId));
  },
});
