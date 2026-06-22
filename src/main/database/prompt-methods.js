const { v4: uuidv4 } = require('uuid');

module.exports = {
  savePromptEnhancement(framework, original, enhanced, score) {
    const id = uuidv4();
    const now = Date.now();
    const stmt = this.db.prepare(`
      INSERT INTO prompt_history (id, framework, original, enhanced, score, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, framework, original, enhanced, score, now);
    return id;
  },

  getPromptHistory(limit = 20) {
    const stmt = this.db.prepare(`
      SELECT * FROM prompt_history
      ORDER BY created_at DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  },
  
  deletePromptHistory(id) {
    const stmt = this.db.prepare(`DELETE FROM prompt_history WHERE id = ?`);
    const result = stmt.run(id);
    return result.changes > 0;
  }
};
