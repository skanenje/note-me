const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');
const { v4: uuidv4 } = require('uuid');

class DatabaseManager {
  constructor() {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'writing-app.db');
    
    console.log('Database path:', dbPath);
    
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    
    this.initSchema();
  }
  
  initSchema() {
    // Documents table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted INTEGER DEFAULT 0
      )
    `);
    
    // Blocks table
    this.db.exec(`
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
    
    // Index for fast block queries by document
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_blocks_document 
      ON blocks(document_id, position) 
      WHERE deleted = 0
    `);
    
    console.log('Schema initialized');
  }
  
  // ===== DOCUMENTS =====
  
  createDocument(title) {
    const id = uuidv4();
    const now = Date.now();
    
    const stmt = this.db.prepare(`
      INSERT INTO documents (id, title, created_at, updated_at, deleted)
      VALUES (?, ?, ?, ?, 0)
    `);
    
    stmt.run(id, title, now, now);
    
    return this.getDocument(id);
  }
  
  getDocument(id) {
    const stmt = this.db.prepare(`
      SELECT * FROM documents WHERE id = ? AND deleted = 0
    `);
    
    return stmt.get(id);
  }
  
  getAllDocuments() {
    const stmt = this.db.prepare(`
      SELECT * FROM documents WHERE deleted = 0 ORDER BY updated_at DESC
    `);
    
    return stmt.all();
  }
  
  // ===== BLOCKS =====
  
  createBlock(documentId, type, content) {
    const id = uuidv4();
    const now = Date.now();
    
    // Get next position (append to end)
    const posStmt = this.db.prepare(`
      SELECT COALESCE(MAX(position), -1) + 1 as next_position
      FROM blocks
      WHERE document_id = ? AND deleted = 0
    `);
    
    const { next_position } = posStmt.get(documentId);
    
    // Insert block
    const stmt = this.db.prepare(`
      INSERT INTO blocks (id, document_id, type, content, position, created_at, updated_at, deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `);
    
    stmt.run(id, documentId, type, content, next_position, now, now);
    
    // Update document timestamp
    this.updateDocumentTimestamp(documentId);
    
    return this.getBlock(id);
  }
  
  getBlock(id) {
    const stmt = this.db.prepare(`
      SELECT * FROM blocks WHERE id = ? AND deleted = 0
    `);
    
    return stmt.get(id);
  }
  
  getBlocksByDocument(documentId) {
    const stmt = this.db.prepare(`
      SELECT * FROM blocks 
      WHERE document_id = ? AND deleted = 0 
      ORDER BY position ASC
    `);
    
    return stmt.all(documentId);
  }
  
  updateBlock(id, content) {
    const now = Date.now();
    
    const stmt = this.db.prepare(`
      UPDATE blocks 
      SET content = ?, updated_at = ?
      WHERE id = ? AND deleted = 0
    `);
    
    const result = stmt.run(content, now, id);
    
    if (result.changes > 0) {
      // Update parent document timestamp
      const block = this.getBlock(id);
      if (block) {
        this.updateDocumentTimestamp(block.document_id);
      }
    }
    
    return this.getBlock(id);
  }
  
  deleteBlock(id) {
    const now = Date.now();
    
    // Soft delete
    const stmt = this.db.prepare(`
      UPDATE blocks 
      SET deleted = 1, updated_at = ?
      WHERE id = ?
    `);
    
    const result = stmt.run(now, id);
    
    return result.changes > 0;
  }
  
  // ===== HELPERS =====
  
  updateDocumentTimestamp(documentId) {
    const now = Date.now();
    
    const stmt = this.db.prepare(`
      UPDATE documents 
      SET updated_at = ?
      WHERE id = ?
    `);
    
    stmt.run(now, documentId);
  }
  
  // Get document with its blocks
  getDocumentWithBlocks(documentId) {
    const document = this.getDocument(documentId);
    if (!document) return null;
    
    const blocks = this.getBlocksByDocument(documentId);
    
    return {
      ...document,
      blocks
    };
  }
  
  close() {
    this.db.close();
  }
}

module.exports = DatabaseManager;