const db = require('better-sqlite3')('/home/swapo/.config/note-me/writing-app.db');
console.log('Enabled tools:', db.prepare('SELECT count(*) as c FROM tools WHERE enabled = 1').get().c);
