// src/main/database/aitools-schema.js
// Defines and seeds the tools + tool_sessions tables in the main SQLite DB.
// This replaces the Rust backend's wax-space.db entirely.

const TOOLS_SEED = [
  { id: 'chatgpt',     name: 'ChatGPT',          url: 'https://chatgpt.com',                      icon_path: '/openai-color.svg' },
  { id: 'claude',      name: 'Claude',            url: 'https://claude.ai',                        icon_path: '/claude-color.svg' },
  { id: 'gemini',      name: 'Gemini',            url: 'https://gemini.google.com',                icon_path: '/gemini-color.svg' },
  { id: 'mistral',     name: 'Mistral',           url: 'https://chat.mistral.ai',                  icon_path: '/mistral-color.svg' },
  { id: 'copilot',     name: 'Copilot',           url: 'https://copilot.microsoft.com',            icon_path: '/copilot-color.svg' },
  { id: 'deepseek',    name: 'DeepSeek',          url: 'https://chat.deepseek.com',                icon_path: '/deepseek-color.svg' },
  { id: 'perplexity',  name: 'Perplexity',        url: 'https://perplexity.ai',                    icon_path: '/perplexity-color.svg' },
  { id: 'grok',        name: 'Grok',              url: 'https://grok.com',                         icon_path: '/grok.svg' },
  { id: 'notebooklm',  name: 'NotebookLM',        url: 'https://notebooklm.google',                icon_path: '/notebooklm.svg' },
  { id: 'v0',          name: 'v0',                url: 'https://v0.dev',                           icon_path: '/v0.svg' },
  { id: 'sora',        name: 'Sora',              url: 'https://sora.com',                         icon_path: '/sora-color.svg' },
  { id: 'azureai',     name: 'Azure AI Foundry',  url: 'https://ai.azure.com',                     icon_path: '/azureai-color.svg' },
  { id: 'vertexai',    name: 'Vertex AI',         url: 'https://console.cloud.google.com',         icon_path: '/vertexai-color.svg' },
  { id: 'openrouter',  name: 'OpenRouter',        url: 'https://openrouter.ai',                    icon_path: '/openrouter.svg' },
  { id: 'huggingface', name: 'Hugging Face',      url: 'https://huggingface.co/chat',              icon_path: '/huggingface-color.svg' },
];

module.exports = function initAIToolsSchema(db) {
  // Tools table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tools (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      url        TEXT NOT NULL,
      icon_path  TEXT,
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
    INSERT OR IGNORE INTO tools (id, name, url, icon_path, enabled)
    VALUES (@id, @name, @url, @icon_path, 1)
  `);

  const seedAll = db.transaction(() => {
    for (const tool of TOOLS_SEED) insert.run(tool);
  });

  seedAll();

  console.log('[AITOOLS-SCHEMA] tools + tool_sessions tables ready');
};
