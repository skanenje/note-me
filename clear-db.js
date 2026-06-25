const db = require('better-sqlite3')('/home/swapo/.config/note-me/writing-app.db');
db.prepare('DELETE FROM tool_sessions').run();
console.log('Sessions cleared!');
