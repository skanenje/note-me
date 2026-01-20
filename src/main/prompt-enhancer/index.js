const fs = require('fs/promises');
const path = require('path');
const { enhanceWithOpenRouter } = require('../services/prompt-enhancer');

const FRAME_DIR = path.join(__dirname, 'frameworks');

const frameworkCache = new Map();

async function listFrameworks() {
  try {
    const files = await fs.readdir(FRAME_DIR);
    const frameworks = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(FRAME_DIR, file);
        try {
          const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
          frameworks.push({
            id: data.id || path.basename(file, '.json'),
            name: data.name,
            description: data.description,
          });
        } catch (error) {
          console.error(`Error parsing framework file: ${file}`, error);
        }
      }
    }
    return frameworks;
  } catch (error) {
    console.error('Error listing frameworks:', error);
    return [];
  }
}

async function getFramework(frameworkId) {
  if (frameworkCache.has(frameworkId)) {
    return frameworkCache.get(frameworkId);
  }

  const filePath = path.join(FRAME_DIR, `${frameworkId}.json`);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(data);
    frameworkCache.set(frameworkId, parsed); // Cache on direct hit
    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT') {
      // try case insensitive
      const files = await fs.readdir(FRAME_DIR);
      for (const file of files) {
        if (file.toLowerCase() === `${frameworkId.toLowerCase()}.json`) {
          const correctFilePath = path.join(FRAME_DIR, file);
          const data = await fs.readFile(correctFilePath, 'utf-8');
          const parsed = JSON.parse(data);
          frameworkCache.set(frameworkId, parsed);
          return parsed;
        }
      }
    }
    return null;
  }
}

function calculateQualityMetrics(prompt, enhancedPrompt) {
  const originalLength = prompt.split(/\s+/).length;
  const enhancedLength = enhancedPrompt.split(/\s+/).length;

  const clarity = Math.min(10, (enhancedLength / Math.max(originalLength, 1)) * 5 + 3);
  const specificity = Math.min(10, 6 + (enhancedPrompt.split(/\s+/).filter(w => w.length > 5).length / enhancedLength * 3));
  const contextRichness = Math.min(10, (enhancedLength / 20) + 5);
  const actionability = Math.min(10, ['provide', 'create', 'build', 'explain', 'analyze'].some(verb => enhancedPrompt.toLowerCase().includes(verb)) ? 7 : 5);
  const overall = (clarity + specificity + contextRichness + actionability) / 4;

  return {
    clarity: Math.round(clarity * 100) / 100,
    specificity: Math.round(specificity * 100) / 100,
    context_richness: Math.round(contextRichness * 100) / 100,
    actionability: Math.round(actionability * 100) / 100,
    overall: Math.round(overall * 100) / 100,
  };
}

async function simpleEnhance(prompt, frameworkId, fields) {
  let framework = null;
  if (frameworkId) {
    framework = await getFramework(frameworkId);
  }

  let enhanced = prompt;

  if (framework && framework.template) {
    enhanced = framework.template.replace('{prompt}', prompt);
    if (fields) {
      for (const [key, value] of Object.entries(fields)) {
        enhanced = enhanced.replace(`{${key}}`, value);
      }
    }
  } else {
    enhanced = `Please provide a detailed response to the following:\n\n${prompt}\n\nConsider all relevant aspects and provide comprehensive information.`;
  }

  return enhanced;
}




async function enhancePrompt({ prompt, framework_id, fields, model = 'openrouter/auto' }) {
    console.log('[ENHANCER] enhancePrompt called');
    console.log('[ENHANCER] Parameters:', {
        prompt_length: prompt?.length,
        framework_id,
        model,
    });
    
    try {
        let enhanced_prompt;
        
        if (framework_id) {
            console.log('[ENHANCER] Using template-based enhancement with framework:', framework_id);
            enhanced_prompt = await simpleEnhance(prompt, framework_id, fields);
        } else {
            console.log('[ENHANCER] Using AI enhancement with model:', model);
            try {
                enhanced_prompt = await enhanceWithOpenRouter(prompt, model);
                console.log('[ENHANCER] AI enhancement succeeded');
            } catch (error) {
                console.error(`[ENHANCER] OpenRouter enhancement failed: ${error.message}`);
                console.log('[ENHANCER] Falling back to basic template enhancement');
                enhanced_prompt = await simpleEnhance(prompt, null, fields); // Fallback to default
            }
        }

        const quality = calculateQualityMetrics(prompt, enhanced_prompt);

        console.log('[ENHANCER] Returning result with enhanced_prompt length:', enhanced_prompt.length);
        return {
            selected_framework: framework_id || 'ai_default',
            enhanced_prompt,
            quality,
        };
    } catch (error) {
        console.error(`[ENHANCER] Exception in enhancePrompt: ${error.message}`);
        console.error('[ENHANCER] Full error:', error);
        // Fallback to the simplest enhancement in case of any unexpected error
        const enhanced_prompt = await simpleEnhance(prompt, null, fields);
        const quality = calculateQualityMetrics(prompt, enhanced_prompt);
        return {
            selected_framework: framework_id || 'fallback',
            enhanced_prompt,
            quality,
        };
    }
}


module.exports = {
  listFrameworks,
  getFramework,
  enhancePrompt,
};
