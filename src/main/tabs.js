const { BrowserView, ipcMain } = require('electron');

const tabs = new Map(); // sessionId -> { view, tool, session }
let activeTabId = null;
let mainWindow = null;
let isAIToolsViewActive = false;

let currentViewBounds = { x: 250, y: 92, width: 800, height: 600 };

function updateActiveViewBounds() {
    if (!activeTabId || !tabs.has(activeTabId) || !mainWindow) return;

    const view = tabs.get(activeTabId).view;

    // Use stored bounds or calculate based on window if needed
    const windowBounds = mainWindow.getContentBounds();
    view.setBounds({
        x: currentViewBounds.x,
        y: currentViewBounds.y,
        width: windowBounds.width - currentViewBounds.x,
        height: windowBounds.height - currentViewBounds.y
    });
    view.setAutoResize({ width: true, height: true });
}

function showBrowserView() {
    if (activeTabId && tabs.has(activeTabId) && mainWindow) {
        const { view } = tabs.get(activeTabId);
        console.log('[TABS] Showing browser view for tab:', activeTabId);
        
        // Check if view is already attached
        const browserViews = mainWindow.getBrowserViews();
        if (!browserViews.includes(view)) {
            mainWindow.setBrowserView(view);
            console.log('[TABS] Added browser view to window');
        }
        
        updateActiveViewBounds();
    }
}

function hideBrowserView() {
    if (!mainWindow) {
        console.error('[TABS] ✗ Cannot hide - mainWindow not available');
        return;
    }
    
    try {
        const browserViews = mainWindow.getBrowserViews();
        console.log('[TABS] ✓ hideBrowserView called, found', browserViews.length, 'views');
        
        if (browserViews.length === 0) {
            console.log('[TABS] ✓ No browser views to hide');
            return;
        }
        
        browserViews.forEach((view, index) => {
            try {
                mainWindow.removeBrowserView(view);
                console.log('[TABS] ✓ Removed browser view', index);
            } catch (err) {
                console.error('[TABS] ✗ Failed to remove view', index, ':', err.message);
            }
        });
        
        const viewsAfter = mainWindow.getBrowserViews();
        console.log('[TABS] ✓ After removal:', viewsAfter.length, 'views remain');
    } catch (err) {
        console.error('[TABS] ✗ hideBrowserView error:', err.message);
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

    const view = new BrowserView({
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            partition: `persist:session-${sessionId}`
        }
    });

    view.webContents.loadURL(toolUrl);
    tabs.set(sessionId, { view });

    // Auto-switch to the newly created tab
    switchToTab(sessionId);

    mainWindow.webContents.send('tab-created', sessionId);
}

function switchToTab(sessionId) {
    if (!tabs.has(sessionId) || !mainWindow) return;

    console.log('[TABS] Switching to tab:', sessionId, 'AI Tools active:', isAIToolsViewActive);
    activeTabId = sessionId;
    
    // Only show the view if AI Tools view is active
    if (isAIToolsViewActive) {
        const { view } = tabs.get(sessionId);
        const browserViews = mainWindow.getBrowserViews();
        
        // Remove other views first
        browserViews.forEach(v => {
            if (v !== view) {
                mainWindow.removeBrowserView(v);
            }
        });
        
        // Add the new view if not already there
        if (!browserViews.includes(view)) {
            mainWindow.setBrowserView(view);
        }
        
        updateActiveViewBounds();
        console.log('[TABS] Displayed browser view for tab:', sessionId);
    } else {
        console.log('[TABS] AI Tools view not active, not showing browser view');
    }

    mainWindow.webContents.send('tab-switched', sessionId);
}

function closeTab(sessionId) {
    if (!tabs.has(sessionId) || !mainWindow) return;

    const { view } = tabs.get(sessionId);

    if (activeTabId === sessionId) {
        if (isAIToolsViewActive) {
            mainWindow.removeBrowserView(view);
        }

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
        if (activeTabId && tabs.has(activeTabId) && isAIToolsViewActive) {
            updateActiveViewBounds();
        }
    });
    
    // Also listen for DevTools toggle (F12 or Ctrl+Shift+I)
    mainWindow.webContents.on('before-input-event', (event, input) => {
        // DevTools toggle keys
        const isDevToolsKey = (input.control && input.shift && input.key.toLowerCase() === 'i') ||
                              input.key === 'F12';
        if (isDevToolsKey && isAIToolsViewActive) {
            console.log('[TABS] DevTools toggle detected - will update bounds in 150ms');
            setTimeout(() => {
                if (activeTabId && tabs.has(activeTabId) && isAIToolsViewActive) {
                    console.log('[TABS] DevTools toggle complete - updating bounds');
                    updateActiveViewBounds();
                }
            }, 150);
        }
    });
    
    // New handler to allow frontend to update layout metrics
    ipcMain.on('update-layout-metrics', (event, { sidebarWidth, toolbarHeight }) => {
        currentViewBounds.x = sidebarWidth;
        currentViewBounds.y = toolbarHeight;
        if (isAIToolsViewActive) {
            updateActiveViewBounds();
        }
    });

    // Handle navigation to/from AI Tools view
    ipcMain.on('navigate-view', (event, viewName) => {
        console.log('\n=== NAVIGATE EVENT ===');
        console.log('[TABS] ✓ Received navigate-view event:', viewName);
        const wasAIToolsActive = isAIToolsViewActive;
        isAIToolsViewActive = (viewName === 'aitools');
        
        console.log('[TABS] ✓ AI Tools active:', wasAIToolsActive, '→', isAIToolsViewActive);
        
        // If transitioning to AI Tools, show the active browser view
        if (isAIToolsViewActive && !wasAIToolsActive) {
            console.log('[TABS] ✓ TRANSITION: TO AI Tools → showing browser view');
            setTimeout(() => showBrowserView(), 50);
        }
        // If transitioning away from AI Tools, hide the browser view
        else if (!isAIToolsViewActive && wasAIToolsActive) {
            console.log('[TABS] ✓ TRANSITION: AWAY from AI Tools → hiding all browser views');
            setTimeout(() => hideBrowserView(), 50);
        } else {
            console.log('[TABS] No state change needed');
        }
        console.log('=== END NAVIGATE ===\n');
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
