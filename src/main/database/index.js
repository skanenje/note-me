const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');
const { v4: uuidv4 } = require('uuid');
const initSchema = require('./schema');
const lmsMethods = require('./lms-methods');

class DatabaseManager {
  constructor() {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'writing-app.db');
    
    console.log('Database path:', dbPath);
    
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    
    initSchema(this.db);
    
    // Bind LMS methods to this instance
    Object.assign(this, lmsMethods);
    
    console.log('Schema initialized');
  }
  
  // Mutation logging
  logMutation(entityType, entityId, operation, payload) {
    const id = uuidv4();
    const now = Date.now();
    
    const stmt = this.db.prepare(`
      INSERT INTO mutations (id, entity_type, entity_id, operation, payload, created_at, synced)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `);
    
    stmt.run(id, entityType, entityId, operation, JSON.stringify(payload), now);
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
  
  // Documents
  createDocument(title) {
    const id = uuidv4();
    const now = Date.now();
    
    const stmt = this.db.prepare(`
      INSERT INTO documents (id, title, created_at, updated_at, deleted)
      VALUES (?, ?, ?, ?, 0)
    `);
    
    stmt.run(id, title, now, now);
    
    this.logMutation('document', id, 'create', { title, created_at: now, updated_at: now });
    
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
    
    this.logMutation('document', id, 'update', { title, updated_at: now });
    
    return this.getDocument(id);
  }
  
  deleteDocument(id) {
    const now = Date.now();
    const stmt = this.db.prepare(`
      UPDATE documents SET deleted = 1, updated_at = ? WHERE id = ?
    `);
    const result = stmt.run(now, id);
    if (result.changes > 0) {
      this.logMutation('document', id, 'delete', { updated_at: now });
    }
    return result.changes > 0;
  }

  // Blocks
  createBlock(documentId, type, content) {
    const id = uuidv4();
    const now = Date.now();
    
    const posStmt = this.db.prepare(`
      SELECT COALESCE(MAX(position), -1) + 1 as next_position
      FROM blocks
      WHERE document_id = ? AND deleted = 0
    `);
    
    const { next_position } = posStmt.get(documentId);
    
    const stmt = this.db.prepare(`
      INSERT INTO blocks (id, document_id, type, content, position, created_at, updated_at, deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `);
    
    stmt.run(id, documentId, type, content, next_position, now, now);
    
    this.logMutation('block', id, 'create', {
      document_id: documentId,
      type,
      content,
      position: next_position,
      created_at: now,
      updated_at: now
    });
    
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
      this.logMutation('block', id, 'update', { content, updated_at: now });
      
      const block = this.getBlock(id);
      if (block) {
        this.updateDocumentTimestamp(block.document_id);
      }
    }
    
    return this.getBlock(id);
  }
  
  deleteBlock(id) {
    const now = Date.now();
    const block = this.getBlock(id);
    if (!block) return false;
    
    const stmt = this.db.prepare(`
      UPDATE blocks 
      SET deleted = 1, updated_at = ?
      WHERE id = ?
    `);
    
    const result = stmt.run(now, id);
    
    if (result.changes > 0) {
      this.logMutation('block', id, 'delete', { updated_at: now });
      this.updateDocumentTimestamp(block.document_id);
    }
    
    return result.changes > 0;
  }
  
  updateDocumentTimestamp(documentId) {
    const now = Date.now();
    
    const stmt = this.db.prepare(`
      UPDATE documents 
      SET updated_at = ?
      WHERE id = ?
    `);
    
    stmt.run(now, documentId);
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
