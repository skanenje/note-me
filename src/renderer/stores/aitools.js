import { writable } from 'svelte/store';

export const tools = writable([]);
export const openTabs = writable([]);
export const activeTabId = writable(null);

const API_BASE = 'http://127.0.0.1:3001/api';

export async function loadTools() {
    console.log('[LOG] loadTools called');
    // Let errors propagate so the component can show an error state
    const response = await fetch(`${API_BASE}/tools`);
    if (!response.ok) {
        throw new Error(`Server returned ${response.status} ${response.statusText}`);
    }
    const toolsData = await response.json();
    console.log('[LOG] loadTools success:', toolsData.length, 'tools');
    tools.set(toolsData);
    return toolsData;
}

export async function createNewTab(tool) {
    console.log('[LOG] createNewTab called:', tool.id);
    const response = await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool_id: tool.id }),
    });
    if (!response.ok) {
        throw new Error(`Failed to create session: ${response.status}`);
    }
    const session = await response.json();
    console.log('[LOG] createNewTab success:', session.id);

    const newTab = { session, tool };
    openTabs.update(tabs => [...tabs, newTab]);
    activeTabId.set(session.id);

    // Tell Electron to create the browser view
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
    if (window.electronAPI) {
        window.electronAPI.closeTab(sessionId);
    }
}

export async function updateSessionActivity(sessionId) {
    try {
        await fetch(`${API_BASE}/sessions/${sessionId}/activity`, { method: 'PUT' });
    } catch (error) {
        console.error('[ERROR] Failed to update session activity:', error);
    }
}
