// src/main/ipc/prompt-enhancer.js
// FIX: was importing from '../prompt-enhancer' (the old process-spawner).
// Now correctly imports from '../services/prompt-enhancer'.
const { ipcMain } = require('electron');
const { listFrameworks, enhancePrompt } = require('../services/prompt-enhancer');

function registerPromptEnhancerHandlers() {
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
            return { success: true, enhancement };
        } catch (error) {
            console.error('[PROMPT_ENHANCER_IPC] Enhancement failed:', error);
            return { success: false, error: error.message };
        }
    });
}

module.exports = registerPromptEnhancerHandlers;
