// src/main/database/aitools-schema.js
// Defines and seeds the tools + tool_sessions tables in the main SQLite DB.
// This replaces the Rust backend's wax-space.db entirely.

const TOOLS_SEED = [
  { id: 'chatgpt',     name: 'ChatGPT',          url: 'https://chatgpt.com',                      icon_path: '/openai-color.svg',      description: 'Advanced conversational AI by OpenAI.' },
  { id: 'claude',      name: 'Claude',            url: 'https://claude.ai',                        icon_path: '/claude-color.svg',      description: 'Helpful and harmless AI by Anthropic.' },
  { id: 'gemini',      name: 'Gemini',            url: 'https://gemini.google.com',                icon_path: '/gemini-color.svg',      description: 'Multimodal AI assistant by Google.' },
  { id: 'mistral',     name: 'Mistral',           url: 'https://chat.mistral.ai',                  icon_path: '/mistral-color.svg',     description: 'Open-weight frontier models from Europe.' },
  { id: 'copilot',     name: 'Copilot',           url: 'https://copilot.microsoft.com',            icon_path: '/copilot-color.svg',     description: 'Your everyday AI companion by Microsoft.' },
  { id: 'deepseek',    name: 'DeepSeek',          url: 'https://chat.deepseek.com',                icon_path: '/deepseek-color.svg',    description: 'Powerful coding and reasoning AI.' },
  { id: 'perplexity',  name: 'Perplexity',        url: 'https://perplexity.ai',                    icon_path: '/perplexity-color.svg',  description: 'AI-powered search engine and answer engine.' },
  { id: 'grok',        name: 'Grok',              url: 'https://grok.com',                         icon_path: '/grok.svg',              description: 'AI with real-time knowledge of the world via X.' },
  { id: 'notebooklm',  name: 'NotebookLM',        url: 'https://notebooklm.google',                icon_path: '/notebooklm.svg',        description: 'Personalised AI research assistant.' },
  { id: 'v0',          name: 'v0',                url: 'https://v0.dev',                           icon_path: '/v0.svg',                description: 'Generate UI components with natural language.' },
  { id: 'sora',        name: 'Sora',              url: 'https://sora.com',                         icon_path: '/sora-color.svg',        description: 'Create realistic video from text instructions.' },
  { id: 'azureai',     name: 'Azure AI Foundry',  url: 'https://ai.azure.com',                     icon_path: '/azureai-color.svg',     description: 'Build, deploy, and manage AI solutions.' },
  { id: 'vertexai',    name: 'Vertex AI',         url: 'https://console.cloud.google.com',         icon_path: '/vertexai-color.svg',    description: 'Enterprise AI platform by Google Cloud.' },
  { id: 'openrouter',  name: 'OpenRouter',        url: 'https://openrouter.ai',                    icon_path: '/openrouter.svg',        description: 'Unified interface for multiple AI models.' },
  { id: 'huggingface', name: 'Hugging Face',      url: 'https://huggingface.co/chat',              icon_path: '/huggingface-color.svg', description: 'Open-source AI community and model hub.' },
];

module.exports = function initAIToolsSchema(db) {
  // Tools table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tools (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      url        TEXT NOT NULL,
      icon_path  TEXT,
      description TEXT,
      enabled    INTEGER DEFAULT 1
    )
  `);

  // Sessions table — tracks open BrowserView tabs across restarts
  db.exec(`
    CREATE TABLE IF NOT EXISTS tool_sessions (
      id             TEXT PRIMARY KEY,
      tool_id        TEXT NOT NULL,
      title          TEXT,
      last_active_at INTEGER NOT NULL,
      created_at     INTEGER NOT NULL,
      position       INTEGER DEFAULT 0,
      pinned         INTEGER DEFAULT 0,
      FOREIGN KEY (tool_id) REFERENCES tools(id)
    )
  `);

  // Seed tools (INSERT OR IGNORE so existing records are not clobbered)
  const insert = db.prepare(`
    INSERT OR IGNORE INTO tools (id, name, url, icon_path, description, enabled)
    VALUES (@id, @name, @url, @icon_path, @description, 1)
  `);

  const seedAll = db.transaction(() => {
    for (const tool of TOOLS_SEED) insert.run(tool);
  });

  seedAll();

  console.log('[AITOOLS-SCHEMA] tools + tool_sessions tables ready');
};
