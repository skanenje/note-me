const { BrowserView, ipcMain } = require('electron');

const tabs = new Map(); // sessionId -> { view, tool, session }
let activeTabId = null;
let mainWindow = null;

let currentViewBounds = { x: 250, y: 92, width: 800, height: 600 };

function updateActiveViewBounds() {
    if (!activeTabId || !tabs.has(activeTabId) || !mainWindow) return;

    const view = tabs.get(activeTabId).view;

    // Use stored bounds or calculate based on window if needed
    // Ideally, these come from the renderer
    const windowBounds = mainWindow.getContentBounds();
    view.setBounds({
        x: currentViewBounds.x,
        y: currentViewBounds.y,
        width: windowBounds.width - currentViewBounds.x,
        height: windowBounds.height - currentViewBounds.y
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
    
    // New handler to allow frontend to update layout metrics
    ipcMain.on('update-layout-metrics', (event, { sidebarWidth, toolbarHeight }) => {
        currentViewBounds.x = sidebarWidth;
        currentViewBounds.y = toolbarHeight;
        updateActiveViewBounds();
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
