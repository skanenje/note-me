const { app } = require('electron');
const Database = require('better-sqlite3');
const initSchema = require('./src/main/database/schema');

app.setName('note-me');
app.whenReady().then(() => {
  try {
    const dbPath = app.getPath('userData') + '/writing-app.db';
    console.log('Testing against real DB:', dbPath);
    const db = new Database(dbPath);
    
    console.log('Running initSchema...');
    initSchema(db);
    console.log('initSchema completed!');
    
  } catch(e) {
    console.error('CRASH:', e.message);
    console.error(e.stack);
  }
  app.quit();
});
