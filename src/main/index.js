const { app } = require('electron');
const { createWindow } = require('./window');
const DatabaseManager = require('./database');
const registerDocumentHandlers = require('./ipc/documents');
const registerBlockHandlers = require('./ipc/blocks');
const registerLessonHandlers = require('./ipc/lessons');
const registerAIHandlers = require('./ipc/ai');

let dbManager;
let mainWindow;

app.whenReady().then(() => {
  dbManager = new DatabaseManager();
  console.log('Database ready');
  
  // Register IPC handlers
  registerDocumentHandlers(dbManager);
  registerBlockHandlers(dbManager);
  registerLessonHandlers(dbManager);
  registerAIHandlers(dbManager);
  
  mainWindow = createWindow();
});

app.on('window-all-closed', () => {
  if (dbManager) {
    dbManager.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
