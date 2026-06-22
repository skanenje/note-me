// src/main/database/aitools-methods.js
// DatabaseManager methods for AI tools — replaces the Rust backend HTTP API.

const { v4: uuidv4 } = require('uuid');

module.exports = {
  /** Return all enabled tools ordered by name */
  getAllTools() {
    const stmt = this.db.prepare(`
      SELECT id, name, url, icon_path, description, enabled
      FROM tools
      WHERE enabled = 1
      ORDER BY name ASC
    `);
    return stmt.all();
  },

  /** Return all persisted sessions, newest-active first */
  getAllSessions() {
    const stmt = this.db.prepare(`
      SELECT id, tool_id, title, last_active_at, created_at, position, pinned
      FROM tool_sessions
      ORDER BY pinned DESC, position ASC, last_active_at DESC
    `);
    return stmt.all();
  },

  /** Create a new session for a given tool */
  createSession(toolId) {
    const id  = uuidv4();
    const now = Date.now();
    this.db.prepare(`
      INSERT INTO tool_sessions (id, tool_id, title, last_active_at, created_at, position, pinned)
      VALUES (?, ?, NULL, ?, ?, 0, 0)
    `).run(id, toolId, now, now);
    return { id, tool_id: toolId, title: null, last_active_at: now, created_at: now, position: 0, pinned: 0 };
  },

  /** Touch a session's last_active_at timestamp */
  updateSessionActivity(sessionId) {
    const now = Date.now();
    this.db.prepare(`
      UPDATE tool_sessions SET last_active_at = ? WHERE id = ?
    `).run(now, sessionId);
    return true;
  },

  /** Delete a session (called when a tab is closed) */
  deleteSession(sessionId) {
    this.db.prepare(`DELETE FROM tool_sessions WHERE id = ?`).run(sessionId);
    return true;
  },

  /** Pin / unpin a session */
  setSessionPinned(sessionId, pinned) {
    this.db.prepare(`UPDATE tool_sessions SET pinned = ? WHERE id = ?`).run(pinned ? 1 : 0, sessionId);
    return true;
  },
};
