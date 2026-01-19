/**
 * Enhance a prompt using OpenRouter API via fetch
 * @param {string} prompt - The original prompt to enhance
 * @param {string} model - The model to use
 * @returns {Promise<string>} - The enhanced prompt
 */
async function enhanceWithOpenRouter(prompt, model = 'google/gemini-2.0-flash-lite-preview-02-05') {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY environment variable is not set. Get your key from: https://openrouter.ai/keys');
    }

    try {
        console.log(`[OPENROUTER] Enhancing prompt with model: ${model}`);
        
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'electron://note-me',
                'User-Agent': 'NoteMeLMS/1.0'
            },
            body: JSON.stringify({
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
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`OpenRouter API error (${response.status}): ${errorData}`);
        }

        const data = await response.json();
        const enhancedPrompt = data.choices[0]?.message?.content;
        
        if (!enhancedPrompt) {
            throw new Error('No content in OpenRouter response');
        }

        console.log('[OPENROUTER] Enhancement successful');
        return enhancedPrompt.trim();
    } catch (error) {
        console.error('[OPENROUTER] Error:', error.message);
        throw error;
    }
}

module.exports = {
    enhanceWithOpenRouter
};
