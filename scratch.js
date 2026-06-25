const db = require('better-sqlite3')('/home/swapo/.config/note-me/writing-app.db');
console.log(db.prepare('SELECT id, enabled FROM tools').all());
require('electron').app.quit();
