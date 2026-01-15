const { BrowserView, ipcMain } = require('electron');

const tabs = new Map(); // sessionId -> { view, tool, session }
let activeTabId = null;
let mainWindow = null;

const TOOLBAR_HEIGHT = 92; // Adjusted for our toolbar height

function updateActiveViewBounds() {
    if (!activeTabId || !tabs.has(activeTabId) || !mainWindow) return;

    const bounds = mainWindow.getContentBounds();
    const view = tabs.get(activeTabId).view;

    // Position below the navigation (250px) and toolbar
    view.setBounds({
        x: 250, // Navigation width
        y: TOOLBAR_HEIGHT,
        width: bounds.width - 250,
        height: bounds.height - TOOLBAR_HEIGHT
    });
    view.setAutoResize({ width: true, height: true });
}

function createTab(sessionId, toolUrl) {
    if (!mainWindow) {
        console.error('[TABS] Main window not set');
        return;
    }

    if (tabs.has(sessionId)) {
        switchToTab(sessionId);
        return;
    }

    const view = new BrowserView({
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            partition: `persist:session-${sessionId}`
        }
    });

    view.webContents.loadURL(toolUrl);
    tabs.set(sessionId, { view });

    if (!activeTabId) {
        activeTabId = sessionId;
        mainWindow.setBrowserView(view);
        // Delay to ensure window is ready
        setTimeout(() => updateActiveViewBounds(), 100);
    }

    mainWindow.webContents.send('tab-created', sessionId);
}

function switchToTab(sessionId) {
    if (!tabs.has(sessionId) || !mainWindow) return;

    activeTabId = sessionId;
    const { view } = tabs.get(sessionId);
    mainWindow.setBrowserView(view);
    updateActiveViewBounds();

    mainWindow.webContents.send('tab-switched', sessionId);
}

function closeTab(sessionId) {
    if (!tabs.has(sessionId) || !mainWindow) return;

    const { view } = tabs.get(sessionId);

    if (activeTabId === sessionId) {
        mainWindow.removeBrowserView(view);

        const tabIds = Array.from(tabs.keys());
        const currentIndex = tabIds.indexOf(sessionId);
        tabs.delete(sessionId);

        const remainingIds = Array.from(tabs.keys());
        if (remainingIds.length > 0) {
            const nextId = remainingIds[Math.min(currentIndex, remainingIds.length - 1)];
            switchToTab(nextId);
        } else {
            activeTabId = null;
        }
    } else {
        tabs.delete(sessionId);
    }

    view.webContents.destroy();
    mainWindow.webContents.send('tab-closed', sessionId);
}

function registerTabHandlers(window) {
    mainWindow = window;

    // Handle window resize
    mainWindow.on('resize', () => {
        if (activeTabId && tabs.has(activeTabId)) {
            updateActiveViewBounds();
        }
    });

    // IPC handlers
    ipcMain.on('create-tab', (event, { sessionId, toolUrl }) => {
        createTab(sessionId, toolUrl);
    });

    ipcMain.on('switch-tab', (event, sessionId) => {
        switchToTab(sessionId);
    });

    ipcMain.on('close-tab', (event, sessionId) => {
        closeTab(sessionId);
    });
}

module.exports = {
    registerTabHandlers
};
