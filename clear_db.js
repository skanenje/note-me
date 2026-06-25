const Database = require('better-sqlite3');
const os = require('os');
const path = require('path');
const dbPath = path.join(os.homedir(), '.config', 'note-me', 'writing-app.db');
const db = new Database(dbPath);
const r1 = db.prepare('DELETE FROM learning_blocks').run();
const r2 = db.prepare('DELETE FROM lessons').run();
console.log(`Deleted ${r1.changes} blocks and ${r2.changes} lessons.`);
