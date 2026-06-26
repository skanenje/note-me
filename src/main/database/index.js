const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');
const { v4: uuidv4 } = require('uuid');
const initSchema = require('./schema');
const initAIToolsSchema = require('./aitools-schema');
const initPromptSchema = require('./prompt-schema');
const lmsMethods = require('./lms-methods');
const aitoolsMethods = require('./aitools-methods');
const promptMethods = require('./prompt-methods');

class DatabaseManager {
  constructor() {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'writing-app.db');
    
    console.log('Database path:', dbPath);
    
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    
    initSchema(this.db);
    initAIToolsSchema(this.db);
    initPromptSchema(this.db);
    
    // Bind methods to this instance
    Object.assign(this, lmsMethods);
    Object.assign(this, aitoolsMethods);
    Object.assign(this, promptMethods);
    
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
      SELECT * FROM mutations WHERE synced = 0 ORDER BY created_at ASC LIMIT ?
    `);
    return stmt.all(limit).map(m => ({ ...m, payload: JSON.parse(m.payload) }));
  }
  
  markMutationsSynced(mutationIds) {
    if (mutationIds.length === 0) return;
    const placeholders = mutationIds.map(() => '?').join(',');
    const stmt = this.db.prepare(`UPDATE mutations SET synced = 1 WHERE id IN (${placeholders})`);
    stmt.run(...mutationIds);
  }
  
  getAllMutations(limit = 50) {
    const stmt = this.db.prepare(`SELECT * FROM mutations ORDER BY created_at DESC LIMIT ?`);
    return stmt.all(limit).map(m => ({ ...m, payload: JSON.parse(m.payload) }));
  }
  
  // ── Documents ────────────────────────────────────────────────────────────────

  createDocument(title, parentId = null) {
    const id = uuidv4();
    const now = Date.now();
    const stmt = this.db.prepare(`
      INSERT INTO documents (id, title, icon, parent_id, is_favorite, is_trashed, created_at, updated_at, deleted)
      VALUES (?, ?, '📄', ?, 0, 0, ?, ?, 0)
    `);
    stmt.run(id, title, parentId, now, now);
    this.logMutation('document', id, 'create', { title, parentId, created_at: now });
    return this.getDocument(id);
  }
  
  getDocument(id) {
    const stmt = this.db.prepare(`SELECT * FROM documents WHERE id = ? AND deleted = 0`);
    return stmt.get(id);
  }
  
  getAllDocuments() {
    const stmt = this.db.prepare(`
      SELECT * FROM documents WHERE deleted = 0 AND is_trashed = 0 ORDER BY updated_at DESC
    `);
    return stmt.all();
  }

  getDocumentTree() {
    const all = this.db.prepare(`
      SELECT id, title, icon, parent_id, is_favorite, updated_at
      FROM documents
      WHERE deleted = 0 AND is_trashed = 0
      ORDER BY updated_at DESC
    `).all();

    const map = {};
    all.forEach(d => { map[d.id] = { ...d, children: [] }; });
    const roots = [];
    all.forEach(d => {
      if (d.parent_id && map[d.parent_id]) {
        map[d.parent_id].children.push(map[d.id]);
      } else {
        roots.push(map[d.id]);
      }
    });
    return roots;
  }

  getFavoriteDocuments() {
    return this.db.prepare(`
      SELECT * FROM documents WHERE deleted = 0 AND is_trashed = 0 AND is_favorite = 1 ORDER BY updated_at DESC
    `).all();
  }

  getTrashedDocuments() {
    return this.db.prepare(`
      SELECT * FROM documents WHERE deleted = 0 AND is_trashed = 1 ORDER BY updated_at DESC
    `).all();
  }

  updateDocumentTitle(id, title) {
    const now = Date.now();
    this.db.prepare(`UPDATE documents SET title = ?, updated_at = ? WHERE id = ? AND deleted = 0`).run(title, now, id);
    this.logMutation('document', id, 'update', { title, updated_at: now });
    return this.getDocument(id);
  }

  updateDocumentMeta(id, { icon, cover }) {
    const now = Date.now();
    const fields = [];
    const values = [];
    if (icon !== undefined) { fields.push('icon = ?'); values.push(icon); }
    if (cover !== undefined) { fields.push('cover = ?'); values.push(cover); }
    if (fields.length === 0) return this.getDocument(id);
    fields.push('updated_at = ?'); values.push(now); values.push(id);
    this.db.prepare(`UPDATE documents SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.getDocument(id);
  }

  toggleFavorite(id) {
    const doc = this.getDocument(id);
    if (!doc) return false;
    const newVal = doc.is_favorite ? 0 : 1;
    this.db.prepare(`UPDATE documents SET is_favorite = ?, updated_at = ? WHERE id = ?`).run(newVal, Date.now(), id);
    return newVal === 1;
  }

  trashDocument(id) {
    const now = Date.now();
    this.db.prepare(`UPDATE documents SET is_trashed = 1, updated_at = ? WHERE id = ?`).run(now, id);
    return true;
  }

  restoreDocument(id) {
    const now = Date.now();
    this.db.prepare(`UPDATE documents SET is_trashed = 0, updated_at = ? WHERE id = ?`).run(now, id);
    return this.getDocument(id);
  }

  deleteDocument(id) {
    const now = Date.now();
    const result = this.db.prepare(`UPDATE documents SET deleted = 1, updated_at = ? WHERE id = ?`).run(now, id);
    if (result.changes > 0) this.logMutation('document', id, 'delete', { updated_at: now });
    return result.changes > 0;
  }

  // ── Blocks ───────────────────────────────────────────────────────────────────

  createBlock(documentId, type, content, options = {}) {
    const id = uuidv4();
    const now = Date.now();
    const { afterBlockId, metadata, indent = 0 } = options;

    let position;
    if (afterBlockId) {
      const afterBlock = this.getBlock(afterBlockId);
      if (afterBlock) {
        // Shift everything after this position up by 1
        this.db.prepare(`
          UPDATE blocks SET position = position + 1
          WHERE document_id = ? AND position > ? AND deleted = 0
        `).run(documentId, afterBlock.position);
        position = afterBlock.position + 1;
      }
    }

    if (position === undefined) {
      const { next_position } = this.db.prepare(`
        SELECT COALESCE(MAX(position), -1) + 1 as next_position
        FROM blocks WHERE document_id = ? AND deleted = 0
      `).get(documentId);
      position = next_position;
    }

    const metaStr = metadata ? JSON.stringify(metadata) : null;
    this.db.prepare(`
      INSERT INTO blocks (id, document_id, type, content, position, metadata, indent, created_at, updated_at, deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(id, documentId, type, content, position, metaStr, indent, now, now);

    this.logMutation('block', id, 'create', { documentId, type, content, position });
    this.updateDocumentTimestamp(documentId);
    return this.getBlock(id);
  }
  
  getBlock(id) {
    const row = this.db.prepare(`SELECT * FROM blocks WHERE id = ? AND deleted = 0`).get(id);
    if (!row) return null;
    return { ...row, metadata: row.metadata ? JSON.parse(row.metadata) : {} };
  }
  
  getBlocksByDocument(documentId) {
    const rows = this.db.prepare(`
      SELECT * FROM blocks WHERE document_id = ? AND deleted = 0 ORDER BY position ASC
    `).all(documentId);
    return rows.map(r => ({ ...r, metadata: r.metadata ? JSON.parse(r.metadata) : {} }));
  }
  
  updateBlock(id, content, metadata) {
    const now = Date.now();
    const metaStr = metadata !== undefined ? JSON.stringify(metadata) : undefined;

    if (metaStr !== undefined) {
      this.db.prepare(`UPDATE blocks SET content = ?, metadata = ?, updated_at = ? WHERE id = ? AND deleted = 0`).run(content, metaStr, now, id);
    } else {
      this.db.prepare(`UPDATE blocks SET content = ?, updated_at = ? WHERE id = ? AND deleted = 0`).run(content, now, id);
    }

    this.logMutation('block', id, 'update', { content, updated_at: now });
    const block = this.getBlock(id);
    if (block) this.updateDocumentTimestamp(block.document_id);
    return this.getBlock(id);
  }

  updateBlockType(id, type) {
    const now = Date.now();
    this.db.prepare(`UPDATE blocks SET type = ?, updated_at = ? WHERE id = ? AND deleted = 0`).run(type, now, id);
    const block = this.getBlock(id);
    if (block) this.updateDocumentTimestamp(block.document_id);
    return this.getBlock(id);
  }
  
  deleteBlock(id) {
    const now = Date.now();
    const block = this.getBlock(id);
    if (!block) return false;
    const result = this.db.prepare(`UPDATE blocks SET deleted = 1, updated_at = ? WHERE id = ?`).run(now, id);
    if (result.changes > 0) {
      this.logMutation('block', id, 'delete', { updated_at: now });
      this.updateDocumentTimestamp(block.document_id);
    }
    return result.changes > 0;
  }

  moveBlock(id, newPosition) {
    const block = this.getBlock(id);
    if (!block) return false;
    const now = Date.now();
    const oldPos = block.position;
    const docId = block.document_id;

    if (newPosition === oldPos) return true;

    if (newPosition > oldPos) {
      this.db.prepare(`
        UPDATE blocks SET position = position - 1
        WHERE document_id = ? AND position > ? AND position <= ? AND deleted = 0 AND id != ?
      `).run(docId, oldPos, newPosition, id);
    } else {
      this.db.prepare(`
        UPDATE blocks SET position = position + 1
        WHERE document_id = ? AND position >= ? AND position < ? AND deleted = 0 AND id != ?
      `).run(docId, newPosition, oldPos, id);
    }

    this.db.prepare(`UPDATE blocks SET position = ?, updated_at = ? WHERE id = ?`).run(newPosition, now, id);
    this.updateDocumentTimestamp(docId);
    return true;
  }

  updateBlockIndent(id, indent) {
    const now = Date.now();
    const clamped = Math.max(0, Math.min(8, indent));
    this.db.prepare(`UPDATE blocks SET indent = ?, updated_at = ? WHERE id = ? AND deleted = 0`).run(clamped, now, id);
    return this.getBlock(id);
  }
  
  updateDocumentTimestamp(documentId) {
    this.db.prepare(`UPDATE documents SET updated_at = ? WHERE id = ?`).run(Date.now(), documentId);
  }
  
  getDocumentWithBlocks(documentId) {
    const document = this.getDocument(documentId);
    if (!document) return null;
    return { ...document, blocks: this.getBlocksByDocument(documentId) };
  }
  
  close() {
    this.db.close();
  }
}

module.exports = DatabaseManager;

