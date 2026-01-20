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
  console.log('[MAIN] App is ready, initializing...');

  dbManager = new DatabaseManager();
  console.log('[MAIN] Database ready');

  // Register IPC handlers
  console.log('[MAIN] Registering IPC handlers...');
  registerDocumentHandlers(dbManager);
  registerBlockHandlers(dbManager);
  registerLessonHandlers(dbManager);
  registerPromptEnhancerHandlers();
  console.log('[MAIN] IPC handlers registered');

  // Start Rust backend server
  console.log('[MAIN] Starting backend...');
  startBackend();

  // Create window after backend starts
  console.log('[MAIN] Scheduling window creation...');
  setTimeout(() => {
    console.log('[MAIN] Creating window...');
    mainWindow = createWindow();
    registerTabHandlers(mainWindow);
    console.log('[MAIN] Window created and tab handlers registered');
  }, 500);
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
