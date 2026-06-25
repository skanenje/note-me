const db = require('better-sqlite3')('/home/swapo/.config/Electron/writing-app.db');
console.log(db.prepare('SELECT count(*) as c FROM tools').get());
