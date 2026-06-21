const { BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const url = require('url');

let rendererServer = null;

// ─── Log file ────────────────────────────────────────────────────────────────
// All log lines from every layer go here so the user can `tail -f` it.
const LOG_FILE = path.join(__dirname, '../../startup-log.txt');

function log(line) {
  const ts = new Date().toISOString();
  const full = `[${ts}] ${line}\n`;
  process.stdout.write(full);
  fs.appendFileSync(LOG_FILE, full);
}

// Wipe log on each app start
fs.writeFileSync(LOG_FILE, `=== Note-Me startup log — ${new Date().toISOString()} ===\n`);

// ─── Renderer HTTP server ────────────────────────────────────────────────────
function startRendererServer(distPath) {
  return new Promise((resolve, reject) => {
    log(`[RENDERER-SERVER] dist path: ${distPath}`);

    const mimeTypes = {
      '.html': 'text/html',
      '.js':   'application/javascript',
      '.css':  'text/css',
      '.svg':  'image/svg+xml',
      '.png':  'image/png',
      '.ico':  'image/x-icon',
      '.json': 'application/json',
      '.woff': 'font/woff',
      '.woff2':'font/woff2',
    };

    const server = http.createServer((req, res) => {
      let pathname = url.parse(req.url).pathname;
      if (pathname === '/') pathname = '/index.html';
      const filePath = path.join(distPath, pathname);

      fs.readFile(filePath, (err, data) => {
        if (err) {
          log(`[RENDERER-SERVER] 404 ${pathname} (${err.code})`);
          // SPA fallback
          const indexPath = path.join(distPath, 'index.html');
          fs.readFile(indexPath, (err2, indexData) => {
            if (err2) {
              res.writeHead(404);
              res.end('Not found');
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(indexData);
            }
          });
          return;
        }

        const ext = path.extname(filePath);
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        log(`[RENDERER-SERVER] 200 ${pathname} (${contentType}, ${data.length} bytes)`);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      });
    });

    server.listen(5174, '127.0.0.1', () => {
      log('[RENDERER-SERVER] Listening on http://127.0.0.1:5174');
      resolve(server);
    });

    server.on('error', (err) => {
      log(`[RENDERER-SERVER] ERROR: ${err.message}`);
      reject(err);
    });

    rendererServer = server;
  });
}

function stopRendererServer() {
  if (rendererServer) {
    rendererServer.close();
    rendererServer = null;
    log('[RENDERER-SERVER] Stopped');
  }
}

// ─── IPC: forward renderer log messages to file ──────────────────────────────
ipcMain.on('renderer-log', (event, message) => {
  log(`[RENDERER] ${message}`);
});

// ─── Window ──────────────────────────────────────────────────────────────────
async function createWindow() {
  log('[WINDOW] Creating BrowserWindow');

  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/index.js')
    }
  });

  mainWindow.webContents.on('console-message', (event, ...args) => {
    let level, message, line, sourceId;
    if (args.length === 1 && typeof args[0] === 'object') {
      level = args[0].level;
      message = args[0].message;
      line = args[0].line;
      sourceId = args[0].sourceId;
    } else {
      [level, message, line, sourceId] = args;
    }
    log(`[RENDERER-CONSOLE] [Level ${level}] ${message} (${sourceId}:${line})`);
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    log(`[WINDOW] did-fail-load: ${errorCode} ${errorDescription}`);
  });

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    log(`[WINDOW] render-process-gone: ${JSON.stringify(details)}`);
  });

  mainWindow.webContents.on('crashed', () => {
    log('[WINDOW] renderer crashed');
  });

  // ── After page is fully loaded, probe the backend directly from the renderer ──
  mainWindow.webContents.on('did-finish-load', async () => {
    log('[WINDOW] did-finish-load fired');

    try {
      // Run a fetch directly in the renderer context and send the result back
      const result = await mainWindow.webContents.executeJavaScript(`
        (async () => {
          try {
            const r = await fetch('http://127.0.0.1:3001/api/tools');
            const data = await r.json();
            return { ok: true, status: r.status, count: Array.isArray(data) ? data.length : -1, raw: JSON.stringify(data).slice(0, 200) };
          } catch (e) {
            return { ok: false, error: e.message };
          }
        })()
      `);
      log(`[PROBE] fetch http://127.0.0.1:3001/api/tools => ${JSON.stringify(result)}`);
    } catch (e) {
      log(`[PROBE] executeJavaScript failed: ${e.message}`);
    }

    // Also probe what window.api and window.electronAPI look like
    try {
      const apis = await mainWindow.webContents.executeJavaScript(`
        JSON.stringify({
          hasApi: typeof window.api !== 'undefined',
          hasElectronAPI: typeof window.electronAPI !== 'undefined',
          apiKeys: window.api ? Object.keys(window.api) : [],
          electronAPIKeys: window.electronAPI ? Object.keys(window.electronAPI) : []
        })
      `);
      log(`[PROBE] window APIs: ${apis}`);
    } catch (e) {
      log(`[PROBE] API probe failed: ${e.message}`);
    }

    // Probe database lessons via window.api
    try {
      const dbLessons = await mainWindow.webContents.executeJavaScript(`
        (async () => {
          try {
            const res = await window.api.getLessons();
            return { ok: true, success: res.success, count: res.lessons ? res.lessons.length : -1, first: res.lessons && res.lessons[0] ? res.lessons[0].title : null, error: res.error };
          } catch (e) {
            return { ok: false, error: e.message };
          }
        })()
      `);
      log(`[PROBE] window.api.getLessons() => ${JSON.stringify(dbLessons)}`);
    } catch (e) {
      log(`[PROBE] getLessons probe failed: ${e.message}`);
    }

    // Probe the rendered HTML to see if Svelte successfully mounted
    try {
      const html = await mainWindow.webContents.executeJavaScript('document.body.innerHTML');
      log(`[PROBE] document.body.innerHTML => ${html}`);
    } catch (e) {
      log(`[PROBE] HTML probe failed: ${e.message}`);
    }

    // ── INTERACTIVE INTEGRATION TEST PROBE ──
    try {
      log('[TEST-PROBE] Starting interactive lesson and quiz test...');
      const testResult = await mainWindow.webContents.executeJavaScript(\`
        (async () => {
          try {
            // Helper to wait for selector
            const waitForSelector = (selector, timeout = 5000) => {
              return new Promise((resolve, reject) => {
                const start = Date.now();
                const check = () => {
                  const el = document.querySelector(selector);
                  if (el) resolve(el);
                  else if (Date.now() - start > timeout) reject(new Error('Timeout waiting for: ' + selector));
                  else setTimeout(check, 100);
                };
                check();
              });
            };

            // 1. Wait for lesson cards to render
            await waitForSelector('.lesson-card');
            const cards = document.querySelectorAll('.lesson-card');
            console.log('[TEST-PROBE-CLIENT] Found ' + cards.length + ' lesson cards');

            // Find RAG card
            let ragCard = null;
            for (const card of cards) {
              const title = card.querySelector('.lesson-card__title')?.textContent || '';
              if (title.includes('RAG')) {
                ragCard = card;
                break;
              }
            }

            if (!ragCard) {
              return { success: false, error: 'RAG & Context Windows 101 card not found' };
            }

            // 2. Click the card to open the lesson
            console.log('[TEST-PROBE-CLIENT] Clicking RAG lesson card...');
            ragCard.click();

            // 3. Wait for lesson view to load
            await waitForSelector('.lesson-view');
            console.log('[TEST-PROBE-CLIENT] Lesson view loaded');

            // Wait for blocks to load
            await waitForSelector('.quiz-block');
            console.log('[TEST-PROBE-CLIENT] Quiz block found');

            const quizQuestion = document.querySelector('.quiz-block__question').textContent;
            console.log('[TEST-PROBE-CLIENT] Quiz Question: ' + quizQuestion);

            const options = document.querySelectorAll('.quiz-option');
            console.log('[TEST-PROBE-CLIENT] Found ' + options.length + ' options');

            // 4. Click incorrect option (index 1)
            console.log('[TEST-PROBE-CLIENT] Clicking incorrect option...');
            options[1].click();

            // Click submit
            const submitBtn = document.querySelector('.quiz-btn--primary');
            submitBtn.click();

            // Wait for incorrect feedback
            await waitForSelector('.quiz-explanation--wrong');
            const wrongHeader = document.querySelector('.quiz-explanation__header').textContent;
            console.log('[TEST-PROBE-CLIENT] Feedback after wrong submission: ' + wrongHeader);

            // Click Try Again
            const retryBtn = document.querySelector('.quiz-btn--secondary');
            retryBtn.click();

            // Wait for reset
            await new Promise(r => setTimeout(r, 200));

            // 5. Click correct option (index 0)
            console.log('[TEST-PROBE-CLIENT] Clicking correct option...');
            const freshOptions = document.querySelectorAll('.quiz-option');
            freshOptions[0].click();

            // Click submit
            const newSubmitBtn = document.querySelector('.quiz-btn--primary');
            newSubmitBtn.click();

            // Wait for correct feedback
            await waitForSelector('.quiz-explanation--correct');
            const correctHeader = document.querySelector('.quiz-explanation__header').textContent;
            const explanation = document.querySelector('.quiz-explanation__text').textContent;
            console.log('[TEST-PROBE-CLIENT] Feedback after correct submission: ' + correctHeader);

            // Wait for progress bar label
            await new Promise(r => setTimeout(r, 300));
            const progressLabel = document.querySelector('.progress-label')?.textContent || 'none';
            console.log('[TEST-PROBE-CLIENT] Progress: ' + progressLabel);

            return {
              success: true,
              quizQuestion,
              wrongHeader,
              correctHeader,
              explanation,
              progressLabel
            };
          } catch (e) {
            return { success: false, error: e.message, stack: e.stack };
          }
        })()
      \`);
      log(\`[TEST-PROBE] Result: \${JSON.stringify(testResult, null, 2)}\`);
    } catch (e) {
      log(\`[TEST-PROBE] Script execution failed: \${e.message}\`);
    }
  });

  if (process.env.NODE_ENV === 'development') {
    log('[WINDOW] Development mode — loading http://localhost:5173');
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    const distPath = path.join(__dirname, '../../dist/renderer');
    await startRendererServer(distPath);
    log('[WINDOW] Production mode — loading http://127.0.0.1:5174');
    await mainWindow.loadURL('http://127.0.0.1:5174');
  }

  return mainWindow;
}

module.exports = { createWindow, stopRendererServer, log };
