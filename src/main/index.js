const { app } = require('electron');
const { createWindow } = require('./window');
const DatabaseManager = require('./database');
const registerDocumentHandlers = require('./ipc/documents');
const registerBlockHandlers = require('./ipc/blocks');
const registerLessonHandlers = require('./ipc/lessons');
const { startBackend, stopBackend } = require('./backend');
const { registerTabHandlers } = require('./tabs');

let dbManager;
let mainWindow;

app.whenReady().then(() => {
  dbManager = new DatabaseManager();
  console.log('Database ready');

  // Register IPC handlers
  registerDocumentHandlers(dbManager);
  registerBlockHandlers(dbManager);
  registerLessonHandlers(dbManager);

  // Start Rust backend server
  startBackend();

  // Create window after backend starts
  setTimeout(() => {
    mainWindow = createWindow();
    registerTabHandlers(mainWindow);
  }, 2000);
});

app.on('window-all-closed', () => {
  if (dbManager) {
    dbManager.close();
  }
  stopBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopBackend();
});
