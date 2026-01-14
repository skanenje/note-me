// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const DatabaseManager = require('./database');

let dbManager;
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: require('path').join(__dirname, 'preload.js')
    }
  });
  
  mainWindow.loadFile('index.html');
  // mainWindow.webContents.openDevTools(); // For debugging
}

app.whenReady().then(() => {
  // Initialize database
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

// IPC Handlers
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
    console.log('Fetched documents:', docs);
    return { success: true, documents: docs };
  } catch (error) {
    console.error('Error fetching documents:', error);
    return { success: false, error: error.message };
  }
});