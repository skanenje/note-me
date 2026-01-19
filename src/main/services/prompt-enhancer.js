const https = require('https');

/**
 * Enhance a prompt using OpenRouter API
 * @param {string} prompt - The original prompt to enhance
 * @param {string} model - The model to use (default: openrouter/auto)
 * @returns {Promise<string>} - The enhanced prompt
 */
async function enhanceWithOpenRouter(prompt, model = 'nvidia/nemotron-3-nano-30b-a3b:free') {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY environment variable is not set');
    }

    const requestBody = JSON.stringify({
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
    });

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'openrouter.ai',
            path: '/api/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody),
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'electron://note-me'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    if (res.statusCode !== 200) {
                        reject(new Error(`OpenRouter API error: ${res.statusCode} - ${data}`));
                        return;
                    }

                    const parsedData = JSON.parse(data);
                    const enhancedPrompt = parsedData.choices[0]?.message?.content || prompt;
                    resolve(enhancedPrompt.trim());
                } catch (error) {
                    reject(new Error(`Failed to parse OpenRouter response: ${error.message}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(new Error(`OpenRouter API request failed: ${error.message}`));
        });

        req.write(requestBody);
        req.end();
    });
}

module.exports = {
    enhanceWithOpenRouter
};
