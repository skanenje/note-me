const { app } = require('electron');
const http = require('http');
const { createWindow, stopRendererServer } = require('./window');
const DatabaseManager = require('./database');
const registerDocumentHandlers = require('./ipc/documents');
const registerBlockHandlers = require('./ipc/blocks');
const registerLessonHandlers = require('./ipc/lessons');
const registerPromptEnhancerHandlers = require('./ipc/prompt-enhancer');
const { startBackend, stopBackend } = require('./backend');
const { registerTabHandlers } = require('./tabs');

let dbManager;
let mainWindow;

/**
 * Poll the Rust backend health endpoint until it responds (or timeout).
 * Resolves true when ready, false if it timed out.
 */
function waitForBackend(url, { intervalMs = 200, timeoutMs = 15000 } = {}) {
  return new Promise((resolve) => {
    const deadline = Date.now() + timeoutMs;

    function attempt() {
      http.get(url, (res) => {
        res.resume(); // consume body so connection closes
        console.log('[BACKEND] Health check passed — server is ready.');
        resolve(true);
      }).on('error', () => {
        if (Date.now() >= deadline) {
          console.error('[BACKEND] Timed out waiting for backend to start.');
          resolve(false);
        } else {
          setTimeout(attempt, intervalMs);
        }
      });
    }

    attempt();
  });
}

app.whenReady().then(async () => {
  dbManager = new DatabaseManager();
  console.log('Database ready');

  // Register IPC handlers
  registerDocumentHandlers(dbManager);
  registerBlockHandlers(dbManager);
  registerLessonHandlers(dbManager);
  registerPromptEnhancerHandlers();

  // Start Rust backend server
  startBackend();

  // Wait until backend HTTP server is actually accepting connections
  const backendReady = await waitForBackend('http://127.0.0.1:3001/api/tools');
  if (!backendReady) {
    console.warn('[BACKEND] Backend did not start in time — opening window anyway.');
  }

  mainWindow = await createWindow();
  registerTabHandlers(mainWindow);
});

app.on('window-all-closed', () => {
  if (dbManager) dbManager.close();
  stopBackend();
  stopRendererServer();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  stopBackend();
  stopRendererServer();
});
