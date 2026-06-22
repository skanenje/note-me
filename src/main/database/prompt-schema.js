module.exports = function initPromptSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS prompt_history (
      id         TEXT PRIMARY KEY,
      framework  TEXT NOT NULL,
      original   TEXT NOT NULL,
      enhanced   TEXT NOT NULL,
      score      REAL,
      created_at INTEGER NOT NULL
    )
  `);
  console.log('[PROMPT-SCHEMA] prompt_history table ready');
};
