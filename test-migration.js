const { app } = require('electron');
const Database = require('better-sqlite3');
const initSchema = require('./src/main/database/schema');
const fs = require('fs');

app.setName('note-me-test2');
app.whenReady().then(() => {
  try {
    const dbPath = app.getPath('userData') + '/writing-app-test.db';
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    const db = new Database(dbPath);
    
    // Create old schema without deleted column
    db.exec(`
      CREATE TABLE documents (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);
    
    console.log('Running initSchema...');
    initSchema(db);
    console.log('initSchema completed!');
    console.log('Lessons count:', db.prepare('SELECT COUNT(*) as c FROM lessons').get().c);
    
  } catch(e) {
    console.error('CRASH:', e.stack);
  }
  app.quit();
});
