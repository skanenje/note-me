const { WebContentsView, ipcMain } = require('electron');

const tabs = new Map(); // sessionId -> { view, tool, session }
let activeTabId = null;
let mainWindow = null;

let currentViewBounds = { x: 250, y: 92, width: 800, height: 600 };

function updateActiveViewBounds() {
    if (!mainWindow || !activeTabId) return;
    const { view } = tabs.get(activeTabId);
    if (!view) return;

    const windowBounds = mainWindow.getContentBounds();
    const bounds = {
        x: currentViewBounds.x,
        y: currentViewBounds.y,
        width: windowBounds.width - currentViewBounds.x,
        height: windowBounds.height - currentViewBounds.y
    };

    console.log(`[TABS] Setting bounds for ${activeTabId}:`, bounds);
    view.setBounds(bounds);
}

function hideTabs() {
    if (!mainWindow) return;
    if (activeTabId && tabs.has(activeTabId)) {
        const { view } = tabs.get(activeTabId);
        try {
            mainWindow.contentView.removeChildView(view);
        } catch (e) {
            console.error('[TABS] Error hiding tab:', e);
        }
    }
}

function showTabs() {
    if (!mainWindow) return;
    if (activeTabId && tabs.has(activeTabId)) {
        const { view } = tabs.get(activeTabId);
        try {
            mainWindow.contentView.addChildView(view);
            updateActiveViewBounds();
        } catch (e) {
            console.error('[TABS] Error showing tab:', e);
        }
    }
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

    const view = new WebContentsView({
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            partition: `persist:aitools`
        }
    });

    const defaultUserAgent = view.webContents.getUserAgent();
    const cleanUserAgent = defaultUserAgent
        .replace(/note-me\/[\d\.]+ /, '')
        .replace(/Electron\/[\d\.]+ /, '');
    view.webContents.setUserAgent(cleanUserAgent);

    console.log(`[TABS] Created WebContentsView for session ${sessionId}, loading ${toolUrl}`);

    view.webContents.on('did-start-loading', () => console.log(`[TABS] ${sessionId} started loading`));
    view.webContents.on('did-finish-load', () => console.log(`[TABS] ${sessionId} finished loading`));
    view.webContents.on('did-fail-load', (e, code, desc) => console.log(`[TABS] ${sessionId} failed to load: ${code} ${desc}`));
    
    view.webContents.loadURL(toolUrl);
    tabs.set(sessionId, { view, toolUrl, session: { id: sessionId } });

    if (!activeTabId) {
        activeTabId = sessionId;
        mainWindow.contentView.addChildView(view);
        // Delay to ensure window is ready
        setTimeout(() => updateActiveViewBounds(), 100);
    }

    mainWindow.webContents.send('tab-created', sessionId);
}

function switchToTab(sessionId) {
    if (!tabs.has(sessionId) || !mainWindow) return;

    if (activeTabId && tabs.has(activeTabId)) {
        const oldView = tabs.get(activeTabId).view;
        mainWindow.contentView.removeChildView(oldView);
    }

    activeTabId = sessionId;
    const { view } = tabs.get(sessionId);
    mainWindow.contentView.addChildView(view);
    updateActiveViewBounds();

    mainWindow.webContents.send('tab-switched', sessionId);
}

function closeTab(sessionId) {
    if (!tabs.has(sessionId) || !mainWindow) return;

    const { view } = tabs.get(sessionId);

    if (activeTabId === sessionId) {
        mainWindow.contentView.removeChildView(view);

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

    ipcMain.on('hide-tabs', () => {
        hideTabs();
    });

    ipcMain.on('show-tabs', () => {
        showTabs();
    });
}

module.exports = {
    registerTabHandlers
};
