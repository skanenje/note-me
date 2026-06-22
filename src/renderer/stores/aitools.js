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
