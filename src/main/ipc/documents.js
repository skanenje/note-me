const { ipcMain } = require('electron');

module.exports = function registerDocumentHandlers(dbManager) {
  ipcMain.handle('create-document', async (_, title) => {
    try {
      const doc = dbManager.createDocument(title);
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
      console.error('Error fetching documents:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-document-with-blocks', async (_, documentId) => {
    try {
      const doc = dbManager.getDocumentWithBlocks(documentId);
      return { success: true, document: doc };
    } catch (error) {
      console.error('Error fetching document with blocks:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-document-title', async (_, { documentId, title }) => {
    try {
      const doc = dbManager.updateDocumentTitle(documentId, title);
      return { success: true, document: doc };
    } catch (error) {
      console.error('Error updating document title:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-document', async (_, documentId) => {
    try {
      const result = dbManager.deleteDocument(documentId);
      return { success: result };
    } catch (error) {
      console.error('Error deleting document:', error);
      return { success: false, error: error.message };
    }
  });
};
