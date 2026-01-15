// src/main/ipc/prompt-enhancer.js
const { ipcMain } = require('electron');
const fetch = require('node-fetch');

const PROMPT_ENHANCER_API = 'http://127.0.0.1:8001';

function registerPromptEnhancerHandlers() {
    ipcMain.handle('prompt-enhancer:get-frameworks', async () => {
        try {
            const response = await fetch(`${PROMPT_ENHANCER_API}/api/frameworks`);
            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            console.error('[PROMPT_ENHANCER_IPC] Failed to fetch frameworks:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('prompt-enhancer:enhance', async (event, request) => {
        try {
            const response = await fetch(`${PROMPT_ENHANCER_API}/api/enhance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: request.prompt,
                    framework_id: request.framework_id,
                    fields: request.fields,
                    explain: request.explain,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                return { success: false, error: error.detail || 'Unknown error' };
            }

            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            console.error('[PROMPT_ENHANCER_IPC] Enhancement failed:', error);
            return { success: false, error: error.message };
        }
    });
}

module.exports = registerPromptEnhancerHandlers;
