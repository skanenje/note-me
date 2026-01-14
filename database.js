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
    
    console.log('Schema initialized');
  }
  
  // Create document
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
  
  // Get document by ID
  getDocument(id) {
    const stmt = this.db.prepare(`
      SELECT * FROM documents WHERE id = ? AND deleted = 0
    `);
    
    return stmt.get(id);
  }
  
  // Get all documents
  getAllDocuments() {
    const stmt = this.db.prepare(`
      SELECT * FROM documents WHERE deleted = 0 ORDER BY updated_at DESC
    `);
    
    return stmt.all();
  }
  
  close() {
    this.db.close();
  }
}

module.exports = DatabaseManager;