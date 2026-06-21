<script>
    import { onMount, tick } from 'svelte';
    import { get } from 'svelte/store';
    import {
        tools,
        openTabs,
        activeTabId,
        loadTools,
        createNewTab,
        switchTab,
        closeTab,
    } from '../stores/aitools.js';

    let loadError = null;
    let loadingTools = true;

    /** Root element of this component — used to measure layout for the BrowserView */
    let containerEl;
    /** Toolbar element — used to measure its height */
    let toolbarEl;

    /**
     * Send the current sidebar + toolbar dimensions to the Electron main process
     * so BrowserView bounds stay in sync with the UI layout.
     */
    function sendLayoutMetrics() {
        if (!window.electronAPI?.updateLayoutMetrics) return;
        if (!containerEl || !toolbarEl) return;

        const containerRect = containerEl.getBoundingClientRect();
        const toolbarRect   = toolbarEl.getBoundingClientRect();

        // containerRect.left  = width of everything to the left (nav + sidebar)
        // toolbarRect.height  = height of the toolbar above the browser area
        const sidebarWidth  = Math.round(containerRect.left);
        const toolbarHeight = Math.round(containerRect.top + toolbarRect.height);

        window.electronAPI.updateLayoutMetrics(sidebarWidth, toolbarHeight);
    }

    onMount(async () => {
        loadingTools = true;
        loadError = null;
        try {
            await loadTools();
        } catch (err) {
            loadError = 'Could not connect to the AI tools server. Make sure the backend is running.';
        } finally {
            loadingTools = false;
        }

        // Wait for DOM to settle then send initial layout metrics
        await tick();
        sendLayoutMetrics();

        // Keep metrics in sync when window is resized
        window.addEventListener('resize', sendLayoutMetrics);

        if (window.electronAPI) {
            window.electronAPI.onTabSwitched((sessionId) => {
                activeTabId.set(sessionId);
            });

            window.electronAPI.onTabClosed((sessionId) => {
                // Capture remaining tabs BEFORE updating activeTabId
                openTabs.update((tabs) => tabs.filter((tab) => tab.session.id !== sessionId));

                activeTabId.update((current) => {
                    if (current !== sessionId) return current;
                    // Read remaining tabs synchronously after the store update above
                    const remaining = get(openTabs);
                    return remaining.length > 0 ? remaining[0].session.id : null;
                });
            });
        }

        return () => {
            window.removeEventListener('resize', sendLayoutMetrics);
        };
    });

    async function handleToolClick(tool) {
        try {
            await createNewTab(tool);
            // Re-send layout metrics after a new tab is opened (toolbar may have grown)
            await tick();
            sendLayoutMetrics();
        } catch (err) {
            console.error('[AI_TOOLS] Failed to create tab:', err);
        }
    }

    function handleTabClick(sessionId) { switchTab(sessionId); }
    function handleTabClose(sessionId) { closeTab(sessionId); }
</script>

<div class="ai-tools" bind:this={containerEl}>
    <!-- Bookmarks toolbar -->
    <div class="toolbar" bind:this={toolbarEl}>
        <div class="bookmarks">
            {#if loadingTools}
                {#each [1,2,3,4,5] as _}
                    <div class="bookmark-skeleton skeleton"></div>
                {/each}
            {:else if loadError}
                <span class="toolbar-error">&#9888; Backend offline</span>
            {:else}
                {#each $tools as tool (tool.id)}
                    <button
                        class="bookmark"
                        on:click={() => handleToolClick(tool)}
                        title={tool.name}
                    >
                        <img src={tool.icon_path} alt={tool.name} />
                    </button>
                {/each}
            {/if}
        </div>

        <!-- Tabs -->
        <div class="tabs">
            {#each $openTabs as tab (tab.session.id)}
                <button
                    class="tab"
                    class:tab--active={$activeTabId === tab.session.id}
                    on:click={() => handleTabClick(tab.session.id)}
                    aria-label="Switch to {tab.tool.name}"
                >
                    <img src={tab.tool.icon_path} alt={tab.tool.name} />
                    <span>{tab.tool.name}</span>
                    <button
                        class="tab__close"
                        on:click|stopPropagation={() => handleTabClose(tab.session.id)}
                        aria-label="Close tab"
                    >&#215;</button>
                </button>
            {/each}
        </div>
    </div>

    <!-- Browser view area -->
    <div class="browser-area">
        {#if $openTabs.length === 0}
            <div class="empty-state">
                {#if loadError}
                    <div class="empty-state__icon">&#9888;&#65039;</div>
                    <h2 class="empty-state__title">Backend Offline</h2>
                    <p class="empty-state__desc">{loadError}</p>
                    <button class="retry-btn" on:click={() => { loadError = null; loadingTools = true; loadTools().catch(e => { loadError = e.message; }).finally(() => loadingTools = false); }}>
                        Retry Connection
                    </button>
                {:else}
                    <div class="empty-state__icon">&#129302;</div>
                    <h2 class="empty-state__title">AI Tools Browser</h2>
                    <p class="empty-state__desc">Click any tool bookmark above to open a session</p>
                {/if}
            </div>
        {/if}
    </div>
</div>

<style>
    .ai-tools {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--clr-bg);
    }

    .toolbar {
        background: var(--clr-surface);
        border-bottom: 1px solid var(--clr-border);
        display: flex;
        flex-direction: column;
        z-index: 10;
        flex-shrink: 0;
    }

    .bookmarks {
        height: 52px;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        overflow-x: auto;
        border-bottom: 1px solid var(--clr-border);
    }

    .bookmark-skeleton {
        width: 34px;
        height: 34px;
        border-radius: var(--r-md);
        flex-shrink: 0;
    }

    .toolbar-error {
        font-size: 0.8rem;
        color: #fca5a5;
        font-weight: 500;
    }

    .bookmark {
        width: 34px;
        height: 34px;
        padding: 5px;
        border: 1px solid transparent;
        background: transparent;
        border-radius: var(--r-md);
        cursor: pointer;
        transition: all var(--t-fast);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .bookmark:hover {
        background: var(--clr-surface2);
        border-color: var(--clr-border);
        transform: scale(1.1);
    }

    .bookmark img { width: 22px; height: 22px; }

    .tabs {
        min-height: 42px;
        display: flex;
        gap: 2px;
        padding: 0 8px;
        overflow-x: auto;
        align-items: flex-end;
    }

    .tab {
        min-width: 160px;
        max-width: 220px;
        height: 38px;
        padding: 0 12px;
        display: flex;
        align-items: center;
        gap: 7px;
        background: var(--clr-surface2);
        border: 1px solid var(--clr-border);
        border-bottom: none;
        border-radius: 8px 8px 0 0;
        cursor: pointer;
        transition: background var(--t-fast);
        color: var(--clr-text-secondary);
        font-size: 0.8rem;
    }

    .tab:hover { background: var(--clr-surface); color: var(--clr-text-primary); }

    .tab--active {
        background: var(--clr-bg);
        color: var(--clr-text-primary);
        border-color: var(--clr-accent);
    }

    .tab img { width: 14px; height: 14px; flex-shrink: 0; }

    .tab span {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .tab__close {
        width: 18px;
        height: 18px;
        border: none;
        background: transparent;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        line-height: 1;
        color: var(--clr-text-muted);
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .tab__close:hover {
        background: rgba(239, 68, 68, 0.2);
        color: #fca5a5;
    }

    .browser-area {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--clr-bg);
    }

    .empty-state {
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 40px;
    }

    .empty-state__icon { font-size: 4rem; opacity: 0.3; }

    .empty-state__title {
        font-size: 1.3rem;
        font-weight: 700;
        color: var(--clr-text-secondary);
    }

    .empty-state__desc {
        font-size: 0.9rem;
        color: var(--clr-text-muted);
        max-width: 380px;
        line-height: 1.6;
    }

    .retry-btn {
        margin-top: 8px;
        padding: 9px 22px;
        background: var(--grad-primary);
        color: white;
        border: none;
        border-radius: var(--r-md);
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        transition: all var(--t-fast);
    }

    .retry-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 16px var(--clr-accent-glow);
    }
</style>
