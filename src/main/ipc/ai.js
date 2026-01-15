const { ipcMain } = require('electron');
const aiService = require('../services/aiService');

module.exports = function registerAIHandlers(dbManager) {
  // AI explanation/tutoring
  ipcMain.handle('ai:explain', async (_, { context, question }) => {
    try {
      const result = await aiService.explainConcept(context, question);
      return result;
    } catch (error) {
      console.error('AI explain error:', error);
      return { success: false, error: error.message };
    }
  });

  // Code execution in playground
  ipcMain.handle('ai:execute-code', async (_, { code, language, blockId }) => {
    try {
      const result = await aiService.executeCode(code, language);
      
      // Save execution history
      if (blockId) {
        dbManager.saveCodeRun(blockId, code, result.output, result.error);
      }
      
      return result;
    } catch (error) {
      console.error('Code execution error:', error);
      return { success: false, error: error.message };
    }
  });

  // Get code execution history
  ipcMain.handle('ai:get-code-history', async (_, blockId) => {
    try {
      const history = dbManager.getCodeRunHistory(blockId);
      return { success: true, history };
    } catch (error) {
      console.error('Error fetching code history:', error);
      return { success: false, error: error.message };
    }
  });
};
