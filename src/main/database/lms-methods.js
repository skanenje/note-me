// LMS-specific database methods
const { v4: uuidv4 } = require('uuid');

module.exports = {
  // Lessons
  getAllLessons() {
    const stmt = this.db.prepare(`
      SELECT * FROM lessons ORDER BY order_index ASC
    `);
    return stmt.all();
  },
  
  getLesson(id) {
    const stmt = this.db.prepare(`
      SELECT * FROM lessons WHERE id = ?
    `);
    return stmt.get(id);
  },
  
  getLessonWithBlocks(lessonId) {
    const lesson = this.getLesson(lessonId);
    if (!lesson) return null;
    
    const blocks = this.getLearningBlocks(lessonId);
    
    return {
      ...lesson,
      blocks
    };
  },
  
  // Learning Blocks
  getLearningBlocks(lessonId) {
    const stmt = this.db.prepare(`
      SELECT * FROM learning_blocks 
      WHERE lesson_id = ? 
      ORDER BY order_index ASC
    `);
    return stmt.all(lessonId);
  },
  
  createLearningBlock(lessonId, type, content, language = null) {
    const id = uuidv4();
    const now = Date.now();
    
    const posStmt = this.db.prepare(`
      SELECT COALESCE(MAX(order_index), -1) + 1 as next_index
      FROM learning_blocks
      WHERE lesson_id = ?
    `);
    
    const { next_index } = posStmt.get(lessonId);
    
    const stmt = this.db.prepare(`
      INSERT INTO learning_blocks 
      (id, lesson_id, type, content, language, order_index, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, lessonId, type, content, language, next_index, now, now);
    
    return { id, lessonId, type, content, language, order_index: next_index };
  },
  
  // Progress Tracking
  updateProgress(lessonId, blockId, status) {
    const id = uuidv4();
    const now = Date.now();
    
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO user_progress 
      (id, lesson_id, block_id, status, last_interaction)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, lessonId, blockId, status, now);
  },
  
  getLessonProgress(lessonId) {
    const stmt = this.db.prepare(`
      SELECT * FROM user_progress 
      WHERE lesson_id = ?
      ORDER BY last_interaction DESC
    `);
    return stmt.all(lessonId);
  },
  
  // Code Runs
  saveCodeRun(blockId, input, output, error) {
    const id = uuidv4();
    const now = Date.now();
    
    const stmt = this.db.prepare(`
      INSERT INTO code_runs (id, block_id, input, output, error, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, blockId, input, output, error, now);
    return id;
  },
  
  getCodeRunHistory(blockId, limit = 10) {
    const stmt = this.db.prepare(`
      SELECT * FROM code_runs 
      WHERE block_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);
    return stmt.all(blockId, limit);
  }
};
