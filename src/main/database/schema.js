// Database schema initialization
module.exports = function initSchema(db) {
  // Documents table
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted INTEGER DEFAULT 0
    )
  `);
  
  // Blocks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS blocks (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      position INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted INTEGER DEFAULT 0,
      FOREIGN KEY (document_id) REFERENCES documents(id)
    )
  `);
  
  // Mutations table (append-only log)
  db.exec(`
    CREATE TABLE IF NOT EXISTS mutations (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      synced INTEGER DEFAULT 0
    )
  `);
  
  // Indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_blocks_document 
    ON blocks(document_id, position) 
    WHERE deleted = 0
  `);
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_mutations_unsynced
    ON mutations(synced, created_at)
    WHERE synced = 0
  `);
};
