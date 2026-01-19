// src/main/ipc/prompt-enhancer.js
const { ipcMain } = require('electron');
const { listFrameworks, enhancePrompt } = require('../prompt-enhancer');

function registerPromptEnhancerHandlers() {
    ipcMain.handle('prompt-enhancer:get-frameworks', async () => {
        try {
            console.log('[IPC] Getting frameworks...');
            const frameworks = await listFrameworks();
            console.log('[IPC] Frameworks loaded:', frameworks.length);
            return { success: true, data: { frameworks } };
        } catch (error) {
            console.error('[IPC] Failed to fetch frameworks:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('prompt-enhancer:enhance', async (event, request) => {
        try {
            const enhancement = await enhancePrompt(request);
            
            return { success: true, data: enhancement };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error occurred' };
        }
    });
}

module.exports = registerPromptEnhancerHandlers;
