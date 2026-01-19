const fs = require('fs/promises');
const path = require('path');

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
    return JSON.parse(data);
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

function generateExplanations(prompt, enhancedPrompt, framework) {
    const explanations = [];

    if (framework) {
        explanations.push(`Applied the ${framework.name} framework to structure the prompt.`);
    }

    if (enhancedPrompt.length > prompt.length * 1.2) {
        explanations.push("Expanded the prompt to provide more detail and context.");
    }

    const originalWords = new Set(prompt.toLowerCase().split(/\s+/));
    const enhancedWords = new Set(enhancedPrompt.toLowerCase().split(/\s+/));

    let addedWords = 0;
    for (const word of enhancedWords) {
        if (!originalWords.has(word)) {
            addedWords++;
        }
    }

    if (addedWords > 5) {
        explanations.push("Introduced new keywords to refine the scope of the prompt.");
    }

    if (/\n\n/.test(enhancedPrompt) && !/\n\n/.test(prompt)) {
        explanations.push("Added paragraph breaks to improve readability.");
    }

    if (explanations.length === 0) {
        explanations.push("The prompt was enhanced, but no specific explanations were generated.");
    }

    return explanations;
}


async function enhancePrompt({ prompt, framework_id, fields, explain = false }) {
    try {
        const enhanced_prompt = await simpleEnhance(prompt, framework_id, fields);
        const selected_framework = framework_id || "basic";

        const quality = calculateQualityMetrics(prompt, enhanced_prompt);

        let explanations = [];
        if (explain) {
            const framework = framework_id ? await getFramework(framework_id) : null;
            explanations = generateExplanations(prompt, enhanced_prompt, framework);
        }

        return {
            selected_framework,
            enhanced_prompt,
            quality,
            explain: explanations
        };
    } catch (error) {
        console.error(`Error enhancing prompt: ${error}`);
        const enhanced_prompt = await simpleEnhance(prompt, framework_id, fields);
        const quality = calculateQualityMetrics(prompt, enhanced_prompt);
        return {
            selected_framework: framework_id || "basic",
            enhanced_prompt,
            quality,
            explain: []
        };
    }
}


module.exports = {
  listFrameworks,
  getFramework,
  enhancePrompt,
};
