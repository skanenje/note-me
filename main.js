// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const DatabaseManager = require('./database');

let dbManager;
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: require('path').join(__dirname, 'preload.js')
    }
  });
  
  mainWindow.loadFile('index.html');
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  dbManager = new DatabaseManager();
  console.log('Database ready');
  
  createWindow();
});

app.on('window-all-closed', () => {
  if (dbManager) {
    dbManager.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ===== DOCUMENT HANDLERS =====

ipcMain.handle('create-document', async (event, title) => {
  try {
    const doc = dbManager.createDocument(title);
    console.log('Created document:', doc);
    return { success: true, document: doc };
  } catch (error) {
    console.error('Error creating document:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-documents', async () => {
  try {
    const docs = dbManager.getAllDocuments();
    return { success: true, documents: docs };
  } catch (error) {
    console.error('Error fetching documents:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-document-with-blocks', async (event, documentId) => {
  try {
    const doc = dbManager.getDocumentWithBlocks(documentId);
    return { success: true, document: doc };
  } catch (error) {
    console.error('Error fetching document with blocks:', error);
    return { success: false, error: error.message };
  }
});

// ===== BLOCK HANDLERS =====

ipcMain.handle('create-block', async (event, { documentId, type, content }) => {
  try {
    const block = dbManager.createBlock(documentId, type, content);
    console.log('Created block:', block);
    return { success: true, block };
  } catch (error) {
    console.error('Error creating block:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-block', async (event, { blockId, content }) => {
  try {
    const block = dbManager.updateBlock(blockId, content);
    console.log('Updated block:', block);
    return { success: true, block };
  } catch (error) {
    console.error('Error updating block:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-block', async (event, blockId) => {
  try {
    const result = dbManager.deleteBlock(blockId);
    console.log('Deleted block:', blockId, result);
    return { success: result };
  } catch (error) {
    console.error('Error deleting block:', error);
    return { success: false, error: error.message };
  }
});