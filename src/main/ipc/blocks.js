const { ipcMain } = require('electron');

module.exports = function registerBlockHandlers(dbManager) {
  ipcMain.handle('create-block', async (_, { documentId, type, content }) => {
    try {
      const block = dbManager.createBlock(documentId, type, content);
      return { success: true, block };
    } catch (error) {
      console.error('Error creating block:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-block', async (_, { blockId, content }) => {
    try {
      const block = dbManager.updateBlock(blockId, content);
      return { success: true, block };
    } catch (error) {
      console.error('Error updating block:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-block', async (_, blockId) => {
    try {
      const result = dbManager.deleteBlock(blockId);
      return { success: result };
    } catch (error) {
      console.error('Error deleting block:', error);
      return { success: false, error: error.message };
    }
  });
};
