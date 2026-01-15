// database.js
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
    
    // Mutations table (append-only log)
    this.db.exec(`
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
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_blocks_document 
      ON blocks(document_id, position) 
      WHERE deleted = 0
    `);
    
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_mutations_unsynced
      ON mutations(synced, created_at)
      WHERE synced = 0
    `);
    
    console.log('Schema initialized');
  }
  
  // ===== MUTATION LOGGING =====
  
  logMutation(entityType, entityId, operation, payload) {
    const id = uuidv4();
    const now = Date.now();
    
    const stmt = this.db.prepare(`
      INSERT INTO mutations (id, entity_type, entity_id, operation, payload, created_at, synced)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `);
    
    stmt.run(id, entityType, entityId, operation, JSON.stringify(payload), now);
    
    console.log(`[MUTATION] ${operation} ${entityType}:${entityId}`);
    
    return id;
  }
  
  getUnsyncedMutations(limit = 100) {
    const stmt = this.db.prepare(`
      SELECT * FROM mutations
      WHERE synced = 0
      ORDER BY created_at ASC
      LIMIT ?
    `);
    
    return stmt.all(limit).map(m => ({
      ...m,
      payload: JSON.parse(m.payload)
    }));
  }
  
  markMutationsSynced(mutationIds) {
    if (mutationIds.length === 0) return;
    
    const placeholders = mutationIds.map(() => '?').join(',');
    const stmt = this.db.prepare(`
      UPDATE mutations
      SET synced = 1
      WHERE id IN (${placeholders})
    `);
    
    stmt.run(...mutationIds);
    
    console.log(`[SYNC] Marked ${mutationIds.length} mutations as synced`);
  }
  
  getAllMutations(limit = 50) {
    const stmt = this.db.prepare(`
      SELECT * FROM mutations
      ORDER BY created_at DESC
      LIMIT ?
    `);
    
    return stmt.all(limit).map(m => ({
      ...m,
      payload: JSON.parse(m.payload)
    }));
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
    
    // Log mutation
    this.logMutation('document', id, 'create', {
      title,
      created_at: now,
      updated_at: now
    });
    
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
  
  updateDocumentTitle(id, title) {
    const now = Date.now();
    
    const stmt = this.db.prepare(`
      UPDATE documents
      SET title = ?, updated_at = ?
      WHERE id = ? AND deleted = 0
    `);
    
    stmt.run(title, now, id);
    
    // Log mutation
    this.logMutation('document', id, 'update', {
      title,
      updated_at: now
    });
    
    return this.getDocument(id);
  }
  
  // ===== BLOCKS =====
  
  createBlock(documentId, type, content) {
    const id = uuidv4();
    const now = Date.now();
    
    // Get next position
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
    
    // Log mutation
    this.logMutation('block', id, 'create', {
      document_id: documentId,
      type,
      content,
      position: next_position,
      created_at: now,
      updated_at: now
    });
    
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
      // Log mutation
      this.logMutation('block', id, 'update', {
        content,
        updated_at: now
      });
      
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
    
    // Get block before deletion
    const block = this.getBlock(id);
    if (!block) return false;
    
    // Soft delete
    const stmt = this.db.prepare(`
      UPDATE blocks 
      SET deleted = 1, updated_at = ?
      WHERE id = ?
    `);
    
    const result = stmt.run(now, id);
    
    if (result.changes > 0) {
      // Log mutation
      this.logMutation('block', id, 'delete', {
        updated_at: now
      });
      
      // Update document timestamp
      this.updateDocumentTimestamp(block.document_id);
    }
    
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
    
    // Note: We don't log mutation for timestamp-only updates
    // to avoid excessive mutation noise
  }
  
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