const { ipcMain } = require('electron');

module.exports = function registerLessonHandlers(dbManager) {
  ipcMain.handle('lessons:get-all', async () => {
    try {
      const lessons = dbManager.getAllLessons();
      return { success: true, lessons };
    } catch (error) {
      console.error('Error fetching lessons:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('lessons:get-with-blocks', async (_, lessonId) => {
    try {
      const lesson = dbManager.getLessonWithBlocks(lessonId);
      return { success: true, lesson };
    } catch (error) {
      console.error('Error fetching lesson with blocks:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('lessons:update-progress', async (_, { lessonId, blockId, status }) => {
    try {
      dbManager.updateProgress(lessonId, blockId, status);
      return { success: true };
    } catch (error) {
      console.error('Error updating progress:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('lessons:get-progress', async (_, lessonId) => {
    try {
      const progress = dbManager.getLessonProgress(lessonId);
      return { success: true, progress };
    } catch (error) {
      console.error('Error fetching progress:', error);
      return { success: false, error: error.message };
    }
  });
};
