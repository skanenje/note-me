require('dotenv').config();
const { app } = require('electron');
const { createWindow } = require('./window');
const DatabaseManager = require('./database');
const registerDocumentHandlers = require('./ipc/documents');
const registerBlockHandlers = require('./ipc/blocks');
const registerLessonHandlers = require('./ipc/lessons');
const registerPromptEnhancerHandlers = require('./ipc/prompt-enhancer');
const { startBackend, stopBackend } = require('./backend');
const { registerTabHandlers } = require('./tabs');

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  // Silently handle to prevent process crash
  // Errors are already handled in IPC handlers
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  // Silently handle to prevent process crash
  // Errors are already handled in IPC handlers
});

let dbManager;
let mainWindow;

app.whenReady().then(() => {
  dbManager = new DatabaseManager();
  console.log('Database ready');

  // Register IPC handlers
  registerDocumentHandlers(dbManager);
  registerBlockHandlers(dbManager);
  registerLessonHandlers(dbManager);
  registerPromptEnhancerHandlers();

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
