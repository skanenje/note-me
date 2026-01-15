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
  
  // AI Integration
  aiExplain: (data) => ipcRenderer.invoke('ai:explain', data),
  executeCode: (data) => ipcRenderer.invoke('ai:execute-code', data),
  getCodeHistory: (blockId) => ipcRenderer.invoke('ai:get-code-history', blockId)
});
