// Database schema initialization
const initLMSSchema = require('./lms-schema');

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
    db.prepare(`
      CREATE TABLE IF NOT EXISTS blocks (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT,
        position INTEGER,
        deleted INTEGER DEFAULT 0,
        created_at INTEGER,
        updated_at INTEGER,
        FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
      )
    `).run();

    // Migrations to add columns to existing tables
    try { db.exec('ALTER TABLE documents ADD COLUMN deleted INTEGER DEFAULT 0;'); } catch (e) { /* ignore if exists */ }
    try { db.exec('ALTER TABLE blocks ADD COLUMN deleted INTEGER DEFAULT 0;'); } catch (e) { /* ignore if exists */ }

    // Mutations - for sync(append-only log)
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

  // ── Notion-style migrations (additive, safe for existing data) ──────────────
  const columns = db.prepare("PRAGMA table_info(documents)").all().map(c => c.name);

  if (!columns.includes('icon'))        db.exec("ALTER TABLE documents ADD COLUMN icon TEXT DEFAULT '📄'");
  if (!columns.includes('cover'))       db.exec("ALTER TABLE documents ADD COLUMN cover TEXT DEFAULT NULL");
  if (!columns.includes('parent_id'))   db.exec("ALTER TABLE documents ADD COLUMN parent_id TEXT DEFAULT NULL");
  if (!columns.includes('is_favorite')) db.exec("ALTER TABLE documents ADD COLUMN is_favorite INTEGER DEFAULT 0");
  if (!columns.includes('is_trashed'))  db.exec("ALTER TABLE documents ADD COLUMN is_trashed INTEGER DEFAULT 0");
  if (!columns.includes('deleted'))     db.exec("ALTER TABLE documents ADD COLUMN deleted INTEGER DEFAULT 0");

  // CRITICAL: SQLite ALTER TABLE only sets DEFAULT for new inserts.
  // Existing rows get NULL — backfill them to 0 so WHERE clauses work correctly.
  db.exec("UPDATE documents SET icon = '📄' WHERE icon IS NULL");
  db.exec("UPDATE documents SET is_favorite = 0 WHERE is_favorite IS NULL");
  db.exec("UPDATE documents SET is_trashed = 0 WHERE is_trashed IS NULL");
  db.exec("UPDATE documents SET deleted = 0 WHERE deleted IS NULL");

  const blockColumns = db.prepare("PRAGMA table_info(blocks)").all().map(c => c.name);
  if (!blockColumns.includes('metadata')) db.exec("ALTER TABLE blocks ADD COLUMN metadata TEXT DEFAULT NULL");
  if (!blockColumns.includes('indent'))   db.exec("ALTER TABLE blocks ADD COLUMN indent INTEGER DEFAULT 0");
  db.exec("UPDATE blocks SET indent = 0 WHERE indent IS NULL");

  // Index for parent_id tree navigation (safe to recreate)
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_documents_parent
    ON documents(parent_id)
    WHERE deleted = 0 AND is_trashed = 0
  `);
  
  // Initialize LMS schema
  initLMSSchema(db);
  
  // Seed initial content if database is empty
  const seedData = require('./seed');
  seedData(db);
};

