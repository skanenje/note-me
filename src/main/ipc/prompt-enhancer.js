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
            console.log('[IPC] Enhance request received');
            console.log('[IPC] Request details:', JSON.stringify({
                has_prompt: !!request.prompt,
                prompt_length: request.prompt?.length,
                use_ai: request.use_ai,
                model: request.model,
                explain: request.explain,
            }));
            
            console.log('[IPC] Calling enhancePrompt with request:', JSON.stringify(request, null, 2));
            const enhancement = await enhancePrompt(request);
            
            console.log('[IPC] Enhancement returned:', JSON.stringify({
                has_enhanced_prompt: !!enhancement.enhanced_prompt,
                enhanced_length: enhancement.enhanced_prompt?.length,
                has_quality: !!enhancement.quality,
            }));
            
            return { success: true, data: enhancement };
        } catch (error) {
            console.error('[IPC] Enhancement failed:', error.message);
            console.error('[IPC] Full error:', error);
            return { success: false, error: error.message };
        }
    });
}

module.exports = registerPromptEnhancerHandlers;
