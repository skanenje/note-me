<script>
    import { onMount } from "svelte";
    import {
        tools,
        openTabs,
        activeTabId,
        loadTools,
        createNewTab,
        switchTab,
        closeTab,
    } from "../stores/aitools";

    onMount(async () => {
        await loadTools();

        // Listen for tab events from main process
        if (window.electronAPI) {
            window.electronAPI.onTabSwitched((sessionId) => {
                activeTabId.set(sessionId);
            });

            window.electronAPI.onTabClosed((sessionId) => {
                openTabs.update((tabs) =>
                    tabs.filter((tab) => tab.session.id !== sessionId),
                );
                activeTabId.update((current) => {
                    if (current === sessionId) {
                        const tabs = [];
                        openTabs.subscribe((t) => tabs.push(...t))();
                        return tabs.length > 0 ? tabs[0].session.id : null;
                    }
                    return current;
                });
            });
        }
    });

    async function handleToolClick(tool) {
        await createNewTab(tool);
    }

    function handleTabClick(sessionId) {
        switchTab(sessionId);
    }

    function handleTabClose(sessionId) {
        closeTab(sessionId);
    }
</script>

<div class="ai-tools-container">
    <!-- Toolbar with AI tool bookmarks -->
    <div class="toolbar">
        <div class="bookmarks">
            {#each $tools as tool (tool.id)}
                <button
                    class="bookmark"
                    on:click={() => handleToolClick(tool)}
                    title={tool.name}
                >
                    <img src={tool.icon_path} alt={tool.name} />
                </button>
            {/each}
        </div>

        <!-- Open tabs -->
        <div class="tabs">
            {#each $openTabs as tab (tab.session.id)}
                <div
                    class="tab"
                    class:active={$activeTabId === tab.session.id}
                    on:click={() => handleTabClick(tab.session.id)}
                >
                    <img src={tab.tool.icon_path} alt={tab.tool.name} />
                    <span>{tab.tool.name}</span>
                    <button
                        class="close"
                        on:click|stopPropagation={() =>
                            handleTabClose(tab.session.id)}>×</button
                    >
                </div>
            {/each}
        </div>
    </div>

    <!-- The actual browser views are managed by Electron main process -->
    <div class="browser-view-placeholder">
        {#if $openTabs.length === 0}
            <div class="empty-state">
                <div class="empty-icon">🤖</div>
                <h2>AI Tools Browser</h2>
                <p>Click on any AI tool above to start a new session</p>
            </div>
        {/if}
    </div>
</div>

<style>
    .ai-tools-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: #f5f5f5;
    }

    .toolbar {
        position: relative;
        background: #f5f5f5;
        border-bottom: 1px solid #ddd;
        display: flex;
        flex-direction: column;
        z-index: 10;
    }

    .bookmarks {
        height: 48px;
        display: flex;
        gap: 8px;
        padding: 8px 12px;
        background: #fff;
        border-bottom: 1px solid #e0e0e0;
        overflow-x: auto;
    }

    .bookmark {
        width: 32px;
        height: 32px;
        padding: 4px;
        border: none;
        background: transparent;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .bookmark:hover {
        background: #f0f0f0;
        transform: scale(1.1);
    }

    .bookmark img {
        width: 24px;
        height: 24px;
    }

    .tabs {
        min-height: 44px;
        display: flex;
        gap: 2px;
        padding: 0 8px;
        overflow-x: auto;
        background: #e8e8e8;
    }

    .tab {
        min-width: 180px;
        max-width: 240px;
        height: 40px;
        margin-top: 4px;
        padding: 0 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        background: #d0d0d0;
        border-radius: 8px 8px 0 0;
        cursor: pointer;
        transition: background 0.15s;
    }

    .tab:hover {
        background: #c0c0c0;
    }

    .tab.active {
        background: #fff;
    }

    .tab img {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
    }

    .tab span {
        flex: 1;
        font-size: 13px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .close {
        width: 20px;
        height: 20px;
        border: none;
        background: transparent;
        border-radius: 4px;
        cursor: pointer;
        font-size: 18px;
        line-height: 1;
        color: #666;
        flex-shrink: 0;
    }

    .close:hover {
        background: rgba(0, 0, 0, 0.1);
        color: #000;
    }

    .browser-view-placeholder {
        flex: 1;
        background: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .empty-state {
        text-align: center;
        color: #666;
    }

    .empty-icon {
        font-size: 64px;
        margin-bottom: 16px;
    }

    .empty-state h2 {
        font-size: 24px;
        margin-bottom: 8px;
        color: #333;
    }

    .empty-state p {
        font-size: 14px;
        color: #999;
    }
</style>
