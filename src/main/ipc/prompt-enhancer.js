// src/main/ipc/prompt-enhancer.js
const { ipcMain } = require('electron');
const { listFrameworks, enhancePrompt } = require('../prompt-enhancer');

function registerPromptEnhancerHandlers() {
    ipcMain.handle('prompt-enhancer:get-frameworks', async () => {
        try {
            const frameworks = await listFrameworks();
            return { success: true, data: { frameworks } };
        } catch (error) {
            console.error('[PROMPT_ENHANCER_IPC] Failed to fetch frameworks:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('prompt-enhancer:enhance', async (event, request) => {
        try {
            const enhancement = await enhancePrompt(request);
            return { success: true, data: enhancement };
        } catch (error) {
            console.error('[PROMPT_ENHANCER_IPC] Enhancement failed:', error);
            return { success: false, error: error.message };
        }
    });
}

module.exports = registerPromptEnhancerHandlers;
