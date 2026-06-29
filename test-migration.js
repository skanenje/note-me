const { app } = require('electron');
const Database = require('better-sqlite3');
const initSchema = require('./src/main/database/schema');

app.setName('note-me-test2');
app.whenReady().then(() => {
  try {
    const dbPath = app.getPath('userData') + '/writing-app-test.db';
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
    
  } catch(e) {
    console.error('CRASH:', e.message);
  }
  app.quit();
});
