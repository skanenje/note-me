const { ipcMain } = require('electron');

module.exports = function registerMutationHandlers(dbManager) {
  ipcMain.handle('get-all-mutations', async (_, limit) => {
    try {
      const mutations = dbManager.getAllMutations(limit || 50);
      return { success: true, mutations };
    } catch (error) {
      console.error('Error fetching mutations:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-unsynced-mutations', async () => {
    try {
      const mutations = dbManager.getUnsyncedMutations();
      return { success: true, mutations };
    } catch (error) {
      console.error('Error fetching unsynced mutations:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('mark-mutations-synced', async (_, mutationIds) => {
    try {
      dbManager.markMutationsSynced(mutationIds);
      return { success: true };
    } catch (error) {
      console.error('Error marking mutations synced:', error);
      return { success: false, error: error.message };
    }
  });
};
