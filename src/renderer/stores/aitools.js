// src/renderer/stores/aitools.js
// All data now comes via Electron IPC (window.api) — no Rust backend required.
import { writable } from 'svelte/store';

export const tools = writable([]);
export const openTabs = writable([]);
export const activeTabId = writable(null);

/** Load tools list from the Node.js DB via IPC */
export async function loadTools() {
    console.log('[AITOOLS] loadTools called');
    const result = await window.api.getTools();
    if (!result.success) {
        throw new Error(result.error || 'Failed to load tools');
    }
    console.log('[AITOOLS] loadTools success:', result.tools.length, 'tools');
    tools.set(result.tools);
    return result.tools;
}
export async function loadSessions() {
    console.log('[AITOOLS] loadSessions called');
    const result = await window.api.getSessions();
    if (!result.success) {
        console.error('[AITOOLS] Failed to load sessions:', result.error);
        return [];
    }
    
    // Join sessions with their corresponding tool definitions
    tools.subscribe(currentTools => {
        if (currentTools.length === 0) return;
        const restoredTabs = result.sessions
            .map(session => ({
                session,
                tool: currentTools.find(t => t.id === session.tool_id)
            }))
            .filter(tab => tab.tool);
            
        openTabs.set(restoredTabs);
        
        // Tell Electron to create BrowserViews for restored tabs
        if (window.electronAPI) {
            for (const tab of restoredTabs) {
                // By sending create-tab for each, it sets up the view in the background.
                // We shouldn't switch immediately to all, so the main process logic might need adjusting 
                // if it auto-switches. However, create-tab only switches if there's no activeTabId.
                window.electronAPI.createTab(tab.session.id, tab.tool.url);
            }
        }
        
        // If there are restored tabs and no active tab, select the first one
        if (restoredTabs.length > 0) {
            let currentActive;
            activeTabId.subscribe(v => currentActive = v)();
            if (!currentActive) {
                switchTab(restoredTabs[0].session.id);
            }
        }
    })();
    return result.sessions;
}

/** Create a new BrowserView tab for a given tool */
export async function createNewTab(tool) {
    console.log('[AITOOLS] createNewTab:', tool.id);

    const result = await window.api.createSession(tool.id);
    if (!result.success) {
        throw new Error(result.error || 'Failed to create session');
    }

    const session = result.session;
    console.log('[AITOOLS] createNewTab session:', session.id);

    const newTab = { session, tool };
    openTabs.update(tabs => [...tabs, newTab]);
    activeTabId.set(session.id);

    // Tell Electron to create the BrowserView
    if (window.electronAPI) {
        window.electronAPI.createTab(session.id, tool.url);
    }

    return session;
}

export function switchTab(sessionId) {
    activeTabId.set(sessionId);
    if (window.electronAPI) {
        window.electronAPI.switchTab(sessionId);
    }
}

export function closeTab(sessionId) {
    // Optimistically remove from store
    openTabs.update(tabs => tabs.filter(t => t.session.id !== sessionId));

    // Tell Electron to destroy the BrowserView
    if (window.electronAPI) {
        window.electronAPI.closeTab(sessionId);
    }

    // Delete session from DB via IPC (fire-and-forget)
    window.api.deleteSession(sessionId).catch(err =>
        console.error('[AITOOLS] deleteSession failed:', err)
    );
}

export async function updateSessionActivity(sessionId) {
    try {
        await window.api.updateSessionActivity(sessionId);
    } catch (err) {
        console.error('[AITOOLS] updateSessionActivity failed:', err);
    }
}

export async function toggleSessionPin(sessionId, pinned) {
    try {
        await window.api.setSessionPinned(sessionId, pinned);
        openTabs.update(tabs => {
            return tabs.map(t => {
                if (t.session.id === sessionId) {
                    return { ...t, session: { ...t.session, pinned: pinned ? 1 : 0 } };
                }
                return t;
            }).sort((a, b) => {
                // sort pinned first, then position/last_active
                if (a.session.pinned !== b.session.pinned) return (b.session.pinned || 0) - (a.session.pinned || 0);
                return b.session.last_active_at - a.session.last_active_at;
            });
        });
    } catch (err) {
        console.error('[AITOOLS] toggleSessionPin failed:', err);
    }
}
