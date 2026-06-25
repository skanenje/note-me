const db = require('better-sqlite3')('/home/swapo/.config/note-me/writing-app.db');
console.log('Tools:', db.prepare('SELECT count(*) as c FROM tools').get().c);
