// src/main/ipc/aitools.js
// IPC handlers for AI Tools — replaces the Rust backend HTTP routes entirely.

const { ipcMain } = require('electron');

module.exports = function registerAIToolsHandlers(dbManager) {
  // GET /api/tools → tools:get-all
  ipcMain.handle('tools:get-all', async () => {
    try {
      const tools = dbManager.getAllTools();
      console.log(`[AITOOLS_IPC] tools:get-all → ${tools.length} tools`);
      return { success: true, tools };
    } catch (err) {
      console.error('[AITOOLS_IPC] tools:get-all failed:', err);
      return { success: false, error: err.message, tools: [] };
    }
  });

  // GET /api/sessions → tools:get-sessions
  ipcMain.handle('tools:get-sessions', async () => {
    try {
      const sessions = dbManager.getAllSessions();
      console.log(`[AITOOLS_IPC] tools:get-sessions → ${sessions.length} sessions`);
      return { success: true, sessions };
    } catch (err) {
      console.error('[AITOOLS_IPC] tools:get-sessions failed:', err);
      return { success: false, error: err.message, sessions: [] };
    }
  });

  // POST /api/sessions → tools:create-session
  ipcMain.handle('tools:create-session', async (_, { tool_id }) => {
    try {
      const session = dbManager.createSession(tool_id);
      console.log(`[AITOOLS_IPC] tools:create-session → ${session.id}`);
      return { success: true, session };
    } catch (err) {
      console.error('[AITOOLS_IPC] tools:create-session failed:', err);
      return { success: false, error: err.message };
    }
  });

  // PUT /api/sessions/:id/activity → tools:update-session-activity
  ipcMain.handle('tools:update-session-activity', async (_, sessionId) => {
    try {
      dbManager.updateSessionActivity(sessionId);
      return { success: true };
    } catch (err) {
      console.error('[AITOOLS_IPC] tools:update-session-activity failed:', err);
      return { success: false, error: err.message };
    }
  });

  // DELETE session → tools:delete-session  (fired when a tab is closed)
  ipcMain.handle('tools:delete-session', async (_, sessionId) => {
    try {
      dbManager.deleteSession(sessionId);
      console.log(`[AITOOLS_IPC] tools:delete-session → ${sessionId}`);
      return { success: true };
    } catch (err) {
      console.error('[AITOOLS_IPC] tools:delete-session failed:', err);
      return { success: false, error: err.message };
    }
  });
};
