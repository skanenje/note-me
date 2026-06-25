const Database = require('better-sqlite3');
const db = new Database('/home/swapo/projects/note-me/noteme.db');
const tools = db.prepare('SELECT id, name, icon_path FROM tools LIMIT 5').all();
console.log(tools);
