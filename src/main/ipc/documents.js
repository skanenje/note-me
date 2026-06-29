const { ipcMain } = require('electron');
const { log } = require('../window');

module.exports = function registerDocumentHandlers(dbManager) {
  ipcMain.handle('create-document', async (_, { title, parentId } = {}) => {
    try {
      const doc = dbManager.createDocument(title || 'Untitled', parentId || null);
      return { success: true, document: doc };
    } catch (error) {
      console.error('Error creating document:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-documents', async () => {
    try {
      const docs = dbManager.getAllDocuments();
      return { success: true, documents: docs };
    } catch (error) {
      log('[IPC] get-documents ERROR: ' + error.message);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-document-tree', async () => {
    try {
      const tree = dbManager.getDocumentTree();
      return { success: true, tree };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-favorites', async () => {
    try {
      const docs = dbManager.getFavoriteDocuments();
      return { success: true, documents: docs };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-trash', async () => {
    try {
      const docs = dbManager.getTrashedDocuments();
      return { success: true, documents: docs };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-document-with-blocks', async (_, documentId) => {
    try {
      const doc = dbManager.getDocumentWithBlocks(documentId);
      return { success: true, document: doc };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-document-title', async (_, { documentId, title }) => {
    try {
      const doc = dbManager.updateDocumentTitle(documentId, title);
      return { success: true, document: doc };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-document-meta', async (_, { documentId, icon, cover }) => {
    try {
      const doc = dbManager.updateDocumentMeta(documentId, { icon, cover });
      return { success: true, document: doc };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('toggle-favorite', async (_, documentId) => {
    try {
      const isFavorite = dbManager.toggleFavorite(documentId);
      return { success: true, isFavorite };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('trash-document', async (_, documentId) => {
    try {
      dbManager.trashDocument(documentId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('restore-document', async (_, documentId) => {
    try {
      const doc = dbManager.restoreDocument(documentId);
      return { success: true, document: doc };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-document', async (_, documentId) => {
    try {
      const result = dbManager.deleteDocument(documentId);
      return { success: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
};
