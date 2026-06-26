const { ipcMain } = require('electron');

module.exports = function registerBlockHandlers(dbManager) {
  ipcMain.handle('create-block', async (_, { documentId, type, content, afterBlockId, metadata, indent }) => {
    try {
      const block = dbManager.createBlock(documentId, type, content || '', { afterBlockId, metadata, indent });
      return { success: true, block };
    } catch (error) {
      console.error('Error creating block:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-block', async (_, { blockId, content, metadata }) => {
    try {
      const block = dbManager.updateBlock(blockId, content, metadata);
      return { success: true, block };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-block-type', async (_, { blockId, type }) => {
    try {
      const block = dbManager.updateBlockType(blockId, type);
      return { success: true, block };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('move-block', async (_, { blockId, newPosition }) => {
    try {
      const result = dbManager.moveBlock(blockId, newPosition);
      return { success: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-block-indent', async (_, { blockId, indent }) => {
    try {
      const block = dbManager.updateBlockIndent(blockId, indent);
      return { success: true, block };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-block', async (_, blockId) => {
    try {
      const result = dbManager.deleteBlock(blockId);
      return { success: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
};
