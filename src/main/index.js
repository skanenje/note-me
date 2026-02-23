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

// Helper function to check if backend is ready
async function isBackendReady() {
  try {
    const response = await fetch('http://localhost:3001/api/tools', {
      timeout: 1000
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Helper function to wait for backend to be ready
async function waitForBackend(maxAttempts = 30, delayMs = 200) {
  for (let i = 0; i < maxAttempts; i++) {
    if (await isBackendReady()) {
      console.log('[MAIN] Backend is ready!');
      return true;
    }
    console.log('[MAIN] Waiting for backend... attempt', i + 1);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  console.error('[MAIN] Backend did not become ready after', maxAttempts * delayMs, 'ms');
  return false;
}

app.whenReady().then(async () => {
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
  
  // Wait for backend to be ready
  console.log('[MAIN] Waiting for backend to be ready...');
  const backendReady = await waitForBackend();
  
  if (!backendReady) {
    console.warn('[MAIN] Backend may not be ready, proceeding anyway...');
  }

  // Create window after backend is ready
  console.log('[MAIN] Creating window...');
  mainWindow = createWindow();
  registerTabHandlers(mainWindow);
  console.log('[MAIN] Window created and tab handlers registered');
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
