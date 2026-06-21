// src/main/services/prompt-enhancer.js
// Provides listFrameworks() and enhancePrompt() for the IPC handler.
// When a Python service is running on port 8001 we forward to it;
// otherwise we fall back to built-in logic so the feature never hard-fails.

const http = require('http');

const PYTHON_SERVICE_URL = 'http://127.0.0.1:8001';

// ── Built-in frameworks (always available as fallback) ──────────────────────
const BUILT_IN_FRAMEWORKS = [
  {
    id: 'cot',
    name: 'Chain of Thought',
    description: 'Step-by-step reasoning with explicit thought process',
  },
  {
    id: 'rtf',
    name: 'Role-Task-Format',
    description: 'Define role, task, and output format for clear results',
  },
  {
    id: 'rse',
    name: 'React-Specific Enhancement',
    description: 'Optimised for React & frontend development prompts',
  },
  {
    id: 'few_shot',
    name: 'Few-Shot',
    description: 'Adds concrete examples to anchor the model behaviour',
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

/** Fire a JSON request to the Python service, resolve with parsed body. */
function callPythonService(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: '127.0.0.1',
      port: 8001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
      timeout: 4000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error('Invalid JSON from Python service'));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Python service timeout')); });

    if (payload) req.write(payload);
    req.end();
  });
}

/** Score a prompt on several dimensions (0–10). */
function scorePrompt(text) {
  const words = text.trim().split(/\s+/).length;
  const hasPurpose = /\b(explain|describe|create|generate|write|build|analyse|analyze|summarize|list|compare)\b/i.test(text);
  const hasContext = words > 20;
  const hasFormat  = /\b(format|output|return|respond|json|markdown|list|table|step)\b/i.test(text);
  const hasRole    = /\b(you are|act as|as an?|imagine|pretend)\b/i.test(text);

  const clarity       = Math.min(10, 3 + (hasPurpose ? 3 : 0) + Math.min(4, words / 10));
  const specificity   = Math.min(10, 2 + (hasContext ? 3 : 0) + Math.min(5, words / 8));
  const contextRich   = Math.min(10, 2 + (hasContext ? 4 : 0) + (hasRole ? 2 : 0) + Math.min(2, words / 30));
  const actionability = Math.min(10, 3 + (hasFormat ? 3 : 0) + (hasPurpose ? 2 : 0) + (hasRole ? 2 : 0));
  const overall       = (clarity + specificity + contextRich + actionability) / 4;

  return {
    overall:          parseFloat(overall.toFixed(1)),
    clarity:          parseFloat(clarity.toFixed(1)),
    specificity:      parseFloat(specificity.toFixed(1)),
    context_richness: parseFloat(contextRich.toFixed(1)),
    actionability:    parseFloat(actionability.toFixed(1)),
  };
}

/** Built-in enhancement logic per framework. */
function builtInEnhance(promptText, frameworkId, explain) {
  const fw = BUILT_IN_FRAMEWORKS.find((f) => f.id === frameworkId) || BUILT_IN_FRAMEWORKS[0];
  let enhanced = promptText.trim();
  const explanations = [];

  switch (frameworkId) {
    case 'cot':
      enhanced = `Let's think step by step.\n\n${enhanced}\n\nPlease reason through each step carefully before providing your final answer.`;
      explanations.push('Added "think step by step" instruction to trigger chain-of-thought reasoning.');
      explanations.push('Added explicit request for step-by-step reasoning before the final answer.');
      break;

    case 'rtf':
      enhanced = `You are an expert assistant.\n\nTask: ${enhanced}\n\nProvide your response in a clear, well-structured format.`;
      explanations.push('Added role definition to anchor the model\'s persona.');
      explanations.push('Wrapped the original prompt as an explicit Task.');
      explanations.push('Added output format instruction.');
      break;

    case 'rse':
      enhanced = `You are a senior React developer.\n\nTask: ${enhanced}\n\nConsiderations:\n- Follow React best practices (hooks, functional components, composition)\n- Ensure code is TypeScript-friendly\n- Add brief inline comments for clarity\n- Keep performance in mind (useMemo, useCallback where appropriate)`;
      explanations.push('Set expert React developer persona.');
      explanations.push('Added React-specific best practice constraints.');
      break;

    case 'few_shot':
      enhanced = `Here are some examples of what I'm looking for:\n\nExample 1: [your example here]\nExample 2: [your example here]\n\nNow, ${enhanced}`;
      explanations.push('Added few-shot example slots to anchor model behaviour.');
      explanations.push('Prefixed the original request with example context.');
      break;

    default:
      enhanced = `${enhanced}\n\nPlease provide a detailed, accurate, and well-structured response.`;
      explanations.push('Added a general quality instruction to improve response quality.');
  }

  return {
    enhanced_prompt: enhanced,
    framework:       fw,
    quality:         scorePrompt(enhanced),
    explain:         explain ? explanations : [],
  };
}

// ── Public API ─────────────────────────────────────────────────────────────

async function listFrameworks() {
  try {
    const data = await callPythonService('/frameworks');
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.frameworks)) return data.frameworks;
  } catch (err) {
    console.log('[PROMPT_ENHANCER] Python service unavailable, using built-in frameworks:', err.message);
  }
  return BUILT_IN_FRAMEWORKS;
}

async function enhancePrompt(request) {
  const { prompt, framework_id, explain = false } = request;

  try {
    const data = await callPythonService('/enhance', 'POST', { prompt, framework_id, explain });
    if (data && data.enhanced_prompt) return data;
  } catch (err) {
    console.log('[PROMPT_ENHANCER] Python service unavailable, using built-in enhancement:', err.message);
  }

  // Fallback to built-in logic
  return builtInEnhance(prompt, framework_id, explain);
}

module.exports = { listFrameworks, enhancePrompt };
