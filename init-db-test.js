const { app } = require('electron');
const Database = require('better-sqlite3');
const initSchema = require('./src/main/database/schema');
const initAIToolsSchema = require('./src/main/database/aitools-schema');
const initPromptSchema = require('./src/main/database/prompt-schema');
const initLMSSchema = require('./src/main/database/lms-schema');
const seedCurriculum = require('./src/main/database/seed');

app.whenReady().then(() => {
  try {
    const dbPath = app.getPath('userData') + '/writing-app.db';
    console.log('Path:', dbPath);
    const db = new Database(dbPath);
    console.log('DB opened');
    
    initSchema(db);
    console.log('initSchema done');
    initAIToolsSchema(db);
    console.log('initAIToolsSchema done');
    initPromptSchema(db);
    console.log('initPromptSchema done');
    
    initLMSSchema(db);
    console.log('initLMSSchema done');
    seedCurriculum(db);
    console.log('seedCurriculum done');
    
    console.log('Lessons:', db.prepare('SELECT COUNT(*) as c FROM lessons').get().c);
    console.log('Blocks:', db.prepare('SELECT COUNT(*) as c FROM learning_blocks').get().c);
    console.log('Success!');
  } catch(e) {
    console.error('Error:', e);
  }
  app.quit();
});
