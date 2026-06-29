const Database = require('better-sqlite3');
const db = new Database('/home/swapo/.config/note-me/writing-app.db');
console.log('Lessons:', db.prepare('SELECT COUNT(*) as c FROM lessons').get().c);
console.log('Blocks:', db.prepare('SELECT COUNT(*) as c FROM learning_blocks').get().c);
