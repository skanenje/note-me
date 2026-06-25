<script>
    import { onMount, tick } from 'svelte';
    import { get } from 'svelte/store';
    import {
        tools,
        openTabs,
        activeTabId,
        loadTools,
        loadSessions,
        createNewTab,
        switchTab,
        closeTab,
        toggleSessionPin,
    } from '../stores/aitools.js';

    let loadError = null;
    let loadingTools = true;
    let isMac = false;

    // We can compute 'recently used' based on last_active_at if we wanted, but for now we'll just show the tools.
    // Actually, sessions have last_active_at. We'll use sessions to get recently used.
    let recentlyUsedTools = [];
    $: {
        if (!$openTabs || $openTabs.length === 0) {
            recentlyUsedTools = [];
        } else {
            const sorted = [...$openTabs].sort((a, b) => b.session.last_active_at - a.session.last_active_at);
            recentlyUsedTools = sorted.map(t => t.tool);
        }
    }

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

    function toolsMounted(node) {
        isMac = window.navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        
        const init = async () => {
            try {
                loadingTools = true;
                loadError = null;
                try {
                    const res = await window.api.getTools();
                    if (res.success) {
                        tools.set(res.tools);
                    } else {
                        loadError = res.error;
                    }
                    
                    const ses = await window.api.getSessions();
                    if (ses.success) {
                        openTabs.set(ses.sessions.map(s => ({ session: s, tool: res.tools.find(t => t.id === s.tool_id) })).filter(t => t.tool));
                    }
                } catch (err) {
                    loadError = `Could not load AI tools: ${err.message}`;
                } finally {
                    loadingTools = false;
                }

                // Wait for DOM to settle then send initial layout metrics
                await tick();
                sendLayoutMetrics();

                if (window.electronAPI && window.electronAPI.showTabs) {
                    window.electronAPI.showTabs();
                }
            } catch (fatalErr) {
                const pre = document.createElement('pre');
                pre.style = "position:absolute;top:0;left:0;z-index:99999;background:red;color:white;padding:20px;";
                pre.innerText = "FATAL SVELTE INIT ERROR: " + (fatalErr.stack || fatalErr.message);
                document.body.appendChild(pre);
            }
        };

        init();

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

        const handleKeyDown = (e) => {
            if (e.ctrlKey || e.metaKey) {
                const num = parseInt(e.key, 10);
                if (num >= 1 && num <= 9) {
                    const tabs = get(openTabs);
                    const index = num - 1;
                    if (tabs[index]) {
                        e.preventDefault();
                        handleTabClick(tabs[index].session.id);
                    }
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        return {
            destroy() {
                window.removeEventListener('resize', sendLayoutMetrics);
                window.removeEventListener('keydown', handleKeyDown);
                if (window.electronAPI && window.electronAPI.hideTabs) {
                    window.electronAPI.hideTabs();
                }
            }
        };
    }

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

<div class="ai-tools" bind:this={containerEl} use:toolsMounted>
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
            {#each $openTabs as tab, i (tab.session.id)}
                <button
                    class="tab"
                    class:tab--active={$activeTabId === tab.session.id}
                    class:tab--pinned={tab.session.pinned}
                    on:click={() => handleTabClick(tab.session.id)}
                    aria-label="Switch to {tab.tool.name}"
                >
                    <img src={tab.tool.icon_path} alt={tab.tool.name} />
                    <span>{tab.tool.name}</span>
                    {#if !tab.session.pinned}
                        <span class="tab__shortcut">{isMac ? '⌘' : 'Ctrl+'}{i + 1}</span>
                    {/if}
                    <button
                        class="tab__pin"
                        class:tab__pin--active={tab.session.pinned}
                        on:click|stopPropagation={() => toggleSessionPin(tab.session.id, !tab.session.pinned)}
                        title={tab.session.pinned ? "Unpin tab" : "Pin tab"}
                    >
                        📌
                    </button>
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
                    <div class="hero">
                        <div class="hero__header">
                            <h2 class="hero__title">AI Tools</h2>
                            <p class="hero__subtitle">Select a tool to launch a new browser session</p>
                        </div>

                        {#if recentlyUsedTools.length > 0}
                            <div class="recently-used">
                                <h3 class="recently-used__title">Recently Used</h3>
                                <div class="recently-used__list">
                                    {#each recentlyUsedTools.slice(0, 5) as tool}
                                        <button class="recently-used__item" on:click={() => handleToolClick(tool)}>
                                            <img src={tool.icon_path} alt={tool.name} />
                                            <span>{tool.name}</span>
                                        </button>
                                    {/each}
                                </div>
                            </div>
                        {/if}

                        <h3 class="hero__section-title">All Tools</h3>
                        <div class="featured-grid">
                            {#each $tools as tool}
                                <button class="featured-tile" on:click={() => handleToolClick(tool)}>
                                    <div class="featured-tile__icon-wrap">
                                        <img src={tool.icon_path} alt={tool.name} class="featured-tile__icon" />
                                    </div>
                                    <div class="featured-tile__info">
                                        <h3 class="featured-tile__name">{tool.name}</h3>
                                        <p class="featured-tile__desc">{tool.description || 'Launch this AI tool'}</p>
                                    </div>
                                </button>
                            {/each}
                        </div>
                    </div>
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

    .bookmark img { width: 26px; height: 26px; background: #ffffff; border-radius: 6px; padding: 3px; box-sizing: border-box; }

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

    .tab img { width: 18px; height: 18px; flex-shrink: 0; background: #ffffff; border-radius: 4px; padding: 2px; box-sizing: border-box; }

    .tab span {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .tab__shortcut {
        font-size: 0.65rem;
        color: var(--clr-text-muted);
        background: var(--clr-bg);
        padding: 2px 4px;
        border-radius: 4px;
        border: 1px solid var(--clr-border);
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

    .tab__pin {
        border: none;
        background: transparent;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        color: var(--clr-text-muted);
        opacity: 0;
        transition: opacity var(--t-fast);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2px;
        filter: grayscale(1);
    }

    .tab:hover .tab__pin {
        opacity: 0.5;
    }

    .tab__pin:hover {
        opacity: 1 !important;
        filter: grayscale(0);
    }

    .tab__pin--active {
        opacity: 1;
        filter: grayscale(0);
    }

    .browser-area {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--clr-bg);
    }

    .empty-state {
        text-align: left;
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        overflow-y: auto;
        padding: 40px;
    }

    .hero {
        max-width: 1000px;
        margin: 0 auto;
        width: 100%;
    }

    .hero__header {
        margin-bottom: 32px;
        text-align: center;
    }

    .hero__title {
        font-size: 2rem;
        font-weight: 800;
        color: var(--clr-text-primary);
        margin-bottom: 8px;
    }

    .hero__subtitle {
        font-size: 1rem;
        color: var(--clr-text-muted);
    }

    .hero__section-title {
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--clr-text-secondary);
        margin-bottom: 16px;
    }

    .recently-used {
        margin-bottom: 40px;
    }

    .recently-used__title {
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--clr-text-secondary);
        margin-bottom: 16px;
    }

    .recently-used__list {
        display: flex;
        gap: 12px;
        overflow-x: auto;
        padding-bottom: 8px;
    }

    .recently-used__item {
        display: flex;
        align-items: center;
        gap: 10px;
        background: var(--clr-surface);
        border: 1px solid var(--clr-border);
        border-radius: var(--r-md);
        padding: 10px 16px;
        color: var(--clr-text-primary);
        font-size: 0.9rem;
        cursor: pointer;
        transition: all var(--t-fast);
        flex-shrink: 0;
    }

    .recently-used__item:hover {
        background: var(--clr-surface2);
        border-color: var(--clr-accent);
        transform: translateY(-2px);
    }

    .recently-used__item img {
        width: 20px;
        height: 20px;
    }

    .featured-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 16px;
    }

    .featured-tile {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        background: var(--clr-surface);
        border: 1px solid var(--clr-border);
        border-radius: var(--r-lg);
        padding: 20px;
        text-align: left;
        cursor: pointer;
        transition: all var(--t-fast);
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .featured-tile:hover {
        background: var(--clr-surface2);
        border-color: var(--clr-accent);
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(0,0,0,0.1);
    }

    .featured-tile__icon-wrap {
        width: 48px;
        height: 48px;
        border-radius: var(--r-md);
        background: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        border: 1px solid var(--clr-border);
    }

    .featured-tile__icon {
        width: 28px;
        height: 28px;
    }

    .featured-tile__info {
        flex: 1;
    }

    .featured-tile__name {
        font-size: 1rem;
        font-weight: 700;
        color: var(--clr-text-primary);
        margin-bottom: 4px;
    }

    .featured-tile__desc {
        font-size: 0.85rem;
        color: var(--clr-text-secondary);
        line-height: 1.4;
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
