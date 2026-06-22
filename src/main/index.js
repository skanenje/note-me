// src/main/index.js
// Main Electron entry point — all features are now served via Node.js IPC.
// The Rust backend (wax-space-server) has been removed entirely.

const { app } = require('electron');
const { createWindow, stopRendererServer } = require('./window');
const DatabaseManager = require('./database');
const registerDocumentHandlers = require('./ipc/documents');
const registerBlockHandlers = require('./ipc/blocks');
const registerLessonHandlers = require('./ipc/lessons');
const registerPromptEnhancerHandlers = require('./ipc/prompt-enhancer');
const registerAIToolsHandlers = require('./ipc/aitools');
const { registerTabHandlers } = require('./tabs');

let dbManager;
let mainWindow;

app.whenReady().then(async () => {
  dbManager = new DatabaseManager();
  console.log('[MAIN] Database ready');

  // Register IPC handlers (all data is served locally — no external server)
  registerDocumentHandlers(dbManager);
  registerBlockHandlers(dbManager);
  registerLessonHandlers(dbManager);
  registerPromptEnhancerHandlers();
  registerAIToolsHandlers(dbManager);

  // Create the main window — no backend poll delay needed
  mainWindow = await createWindow();
  registerTabHandlers(mainWindow);

  console.log('[MAIN] App ready');
});

app.on('window-all-closed', () => {
  if (dbManager) dbManager.close();
  stopRendererServer();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  stopRendererServer();
});
