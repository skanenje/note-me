import { writable } from 'svelte/store';

export const tools = writable([]);
export const openTabs = writable([]);
export const activeTabId = writable(null);

const API_BASE = "http://localhost:3001/api";

// Retry logic for API calls
async function fetchWithRetry(url, options = {}, maxRetries = 5, delay = 500) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, { ...options, timeout: 3000 });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response;
        } catch (error) {
            lastError = error;
            console.log(`[LOG] Fetch attempt ${i + 1}/${maxRetries} failed for ${url}:`, error.message);
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
}

export async function loadTools() {
    try {
        console.log("[LOG] loadTools called");
        const response = await fetchWithRetry(`${API_BASE}/tools`);
        const toolsData = await response.json();
        console.log("[LOG] loadTools success:", toolsData);
        tools.set(toolsData);
        return toolsData;
    } catch (error) {
        console.error("[ERROR] Failed to load tools after retries:", error);
        return [];
    }
}

export async function createNewTab(tool) {
    try {
        console.log("[LOG] createNewTab called:", tool.id);
        const response = await fetchWithRetry(`${API_BASE}/sessions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tool_id: tool.id }),
        });
        const session = await response.json();
        console.log("[LOG] createNewTab success:", session);

        const newTab = { session, tool };
        openTabs.update(tabs => [...tabs, newTab]);
        activeTabId.set(session.id);

        // Tell Electron to create the browser view
        if (window.electronAPI) {
            window.electronAPI.createTab(session.id, tool.url);
        }

        return session;
    } catch (error) {
        console.error("[ERROR] Failed to create tab:", error);
        throw error;
    }
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
        console.log("[LOG] updateSessionActivity called:", sessionId);
        await fetchWithRetry(`${API_BASE}/sessions/${sessionId}/activity`, {
            method: "PUT",
        });
        console.log("[LOG] updateSessionActivity success");
    } catch (error) {
        console.error("[ERROR] Failed to update session activity:", error);
        throw error;
    }
}
