const Database = require('better-sqlite3');
const dbPath = '/mnt/c/Users/swapo/AppData/Roaming/Note-Me/writing-app.db';
try {
  const db = new Database(dbPath, { readonly: true });
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables:', tables.map(t => t.name));
  console.log('Documents Schema:', db.prepare('PRAGMA table_info(documents)').all());
  console.log('Blocks Schema:', db.prepare('PRAGMA table_info(blocks)').all());
  console.log('Learning Blocks Schema:', db.prepare('PRAGMA table_info(learning_blocks)').all());
  console.log('Lessons:', db.prepare('SELECT id, title FROM lessons').all());
  console.log('Docs count:', db.prepare('SELECT COUNT(*) FROM documents').get());
  console.log('Learning Blocks count:', db.prepare('SELECT COUNT(*) FROM learning_blocks').get());
} catch(e) {
  console.error(e);
}
