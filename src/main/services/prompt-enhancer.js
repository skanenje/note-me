/**
 * Enhance a prompt using OpenRouter API via fetch
 * @param {string} prompt - The original prompt to enhance
 * @param {string} model - The model to use
 * @returns {Promise<string>} - The enhanced prompt
 */
async function enhanceWithOpenRouter(prompt, model = 'qwen/qwen-2.5-72b-instruct') {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    console.log('[OPENROUTER] Starting enhancement');
    console.log('[OPENROUTER] API Key configured:', !!apiKey);
    console.log('[OPENROUTER] Model:', model);
    console.log('[OPENROUTER] Prompt length:', prompt.length);
    
    if (!apiKey) {
        const errMsg = 'OPENROUTER_API_KEY environment variable is not set. Get your key from: https://openrouter.ai/keys';
        console.error('[OPENROUTER]', errMsg);
        throw new Error(errMsg);
    }

    try {
        console.log(`[OPENROUTER] Making API request to OpenRouter...`);
        
        const requestBody = {
            model: model,
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert prompt engineer. Your task is to enhance and refine user prompts to make them more effective, clear, and specific. Return only the enhanced prompt without any additional explanation.'
                },
                {
                    role: 'user',
                    content: `Please enhance this prompt to make it clearer, more specific, and more effective:\n\n${prompt}`
                }
            ],
            temperature: 0.7,
            max_tokens: 500
        };
        
        console.log('[OPENROUTER] Request body prepared');
        
        // Create abort controller with 30 second timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey.substring(0, 10)}...`,
                    'HTTP-Referer': 'electron://note-me',
                    'User-Agent': 'NoteMeLMS/1.0'
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal,
                timeout: 30000
            });

            clearTimeout(timeoutId);

            console.log('[OPENROUTER] Response status:', response.status);
            console.log('[OPENROUTER] Response ok:', response.ok);

            if (!response.ok) {
                const errorData = await response.text();
                console.error('[OPENROUTER] Error response body:', errorData);
                throw new Error(`OpenRouter API error (${response.status}): ${errorData}`);
            }

            const data = await response.json();
            console.log('[OPENROUTER] Response parsed');
            console.log('[OPENROUTER] Response structure:', JSON.stringify({
                has_choices: !!data.choices,
                choices_length: data.choices?.length,
                has_first_choice: !!data.choices?.[0],
                has_message: !!data.choices?.[0]?.message,
                has_content: !!data.choices?.[0]?.message?.content,
            }));
            
            const enhancedPrompt = data.choices[0]?.message?.content;
            
            if (!enhancedPrompt) {
                console.error('[OPENROUTER] No content in response');
                throw new Error('No content in OpenRouter response');
            }

            console.log('[OPENROUTER] Enhancement successful, length:', enhancedPrompt.length);
            return enhancedPrompt.trim();
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                console.error('[OPENROUTER] Request timeout after 30 seconds');
                throw new Error('OpenRouter API request timeout');
            }
            throw error;
        }
    } catch (error) {
        console.error('[OPENROUTER] Error occurred:', error.message);
        console.error('[OPENROUTER] Full error:', error);
        throw error;
    }
}

module.exports = {
    enhanceWithOpenRouter
};
