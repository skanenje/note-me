// src/main/ipc/prompt-enhancer.js
// FIX: was importing from '../prompt-enhancer' (the old process-spawner).
// Now correctly imports from '../services/prompt-enhancer'.
const { ipcMain } = require('electron');
const { listFrameworks, enhancePrompt } = require('../services/prompt-enhancer');

function registerPromptEnhancerHandlers(dbManager) {
    ipcMain.handle('prompt-enhancer:get-frameworks', async () => {
        try {
            const frameworks = await listFrameworks();
            // Return consistent shape: { success, frameworks }
            return { success: true, frameworks };
        } catch (error) {
            console.error('[PROMPT_ENHANCER_IPC] Failed to fetch frameworks:', error);
            return { success: false, error: error.message, frameworks: [] };
        }
    });

    ipcMain.handle('prompt-enhancer:enhance', async (event, request) => {
        try {
            const enhancement = await enhancePrompt(request);
            
            // Save to database
            const score = enhancement.quality?.overall || 0;
            const historyId = dbManager.savePromptEnhancement(
              request.framework_id,
              request.prompt,
              enhancement.enhanced_prompt,
              score
            );
            
            return { success: true, enhancement, historyId };
        } catch (error) {
            console.error('[PROMPT_ENHANCER_IPC] Enhancement failed:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('prompt-enhancer:get-history', async (event, limit = 20) => {
        try {
            const history = dbManager.getPromptHistory(limit);
            return { success: true, history };
        } catch (error) {
            console.error('[PROMPT_ENHANCER_IPC] Failed to get history:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('prompt-enhancer:delete-history', async (event, id) => {
        try {
            const result = dbManager.deletePromptHistory(id);
            return { success: result };
        } catch (error) {
            console.error('[PROMPT_ENHANCER_IPC] Failed to delete history:', error);
            return { success: false, error: error.message };
        }
    });
}

module.exports = registerPromptEnhancerHandlers;
