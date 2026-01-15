// LMS-specific schema extensions
module.exports = function initLMSSchema(db) {
  // Lessons - curriculum structure
  db.exec(`
    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      order_index INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
  
  // Learning blocks - executable content
  db.exec(`
    CREATE TABLE IF NOT EXISTS learning_blocks (
      id TEXT PRIMARY KEY,
      lesson_id TEXT NOT NULL,
      type TEXT CHECK(type IN ('text', 'prompt', 'code', 'playground', 'quiz')) NOT NULL,
      content TEXT NOT NULL,
      language TEXT,
      order_index INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id)
    )
  `);
  
  // User progress - state tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_progress (
      id TEXT PRIMARY KEY,
      lesson_id TEXT NOT NULL,
      block_id TEXT,
      status TEXT CHECK(status IN ('locked', 'started', 'completed')) NOT NULL,
      last_interaction INTEGER NOT NULL,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id)
    )
  `);
  
  // Code runs - execution history
  db.exec(`
    CREATE TABLE IF NOT EXISTS code_runs (
      id TEXT PRIMARY KEY,
      block_id TEXT NOT NULL,
      input TEXT NOT NULL,
      output TEXT,
      error TEXT,
      created_at INTEGER NOT NULL
    )
  `);
  
  // Indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_learning_blocks_lesson 
    ON learning_blocks(lesson_id, order_index)
  `);
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_progress_lesson
    ON user_progress(lesson_id, status)
  `);
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_code_runs_block
    ON code_runs(block_id, created_at DESC)
  `);
};
