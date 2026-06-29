const { app } = require('electron');
const Database = require('better-sqlite3');
app.setName('note-me');
app.whenReady().then(() => {
  try {
    const db = new Database(app.getPath('userData') + '/writing-app.db');
    console.log('Path:', app.getPath('userData') + '/writing-app.db');
    console.log('Lessons:', db.prepare('SELECT COUNT(*) as c FROM lessons').get().c);
    console.log('Blocks:', db.prepare('SELECT COUNT(*) as c FROM learning_blocks').get().c);
    console.log('Success!');
  } catch(e) {
    console.error('Error:', e);
  }
  app.quit();
});
