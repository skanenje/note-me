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

<div class="flex flex-col h-full bg-gray-100">
    <!-- Toolbar with AI tool bookmarks -->
    <div class="relative bg-gray-100 border-b border-gray-300 flex flex-col z-10">
        <div class="h-12 flex gap-2 px-3 py-2 bg-white border-b border-gray-200 overflow-x-auto">
            {#each $tools as tool (tool.id)}
                <button
                    class="w-8 h-8 p-1 border-none bg-transparent rounded transition-all flex items-center justify-center cursor-pointer hover:bg-gray-100 hover:scale-110"
                    on:click={() => handleToolClick(tool)}
                    title={tool.name}
                >
                    <img src={tool.icon_path} alt={tool.name} class="w-6 h-6" />
                </button>
            {/each}
        </div>

        <!-- Open tabs -->
        <div class="min-h-11 flex gap-0.5 px-2 overflow-x-auto bg-gray-300">
            {#each $openTabs as tab (tab.session.id)}
                <div
                    class="min-w-44 max-w-60 h-10 mt-1 px-3 flex items-center gap-2 bg-gray-400 rounded-t-lg cursor-pointer transition-colors {$activeTabId === tab.session.id ? 'bg-white' : 'bg-gray-400 hover:bg-gray-300'}"
                    on:click={() => handleTabClick(tab.session.id)}
                    on:keydown={(e) => {if (e.key === 'Enter') handleTabClick(tab.session.id)}}
                    role="button"
                    tabindex="0"
                >
                    <img src={tab.tool.icon_path} alt={tab.tool.name} class="w-4 h-4 flex-shrink-0" />
                    <span class="flex-1 text-xs whitespace-nowrap overflow-hidden text-ellipsis">{tab.tool.name}</span>
                    <button
                        class="w-5 h-5 border-none bg-transparent rounded cursor-pointer text-lg leading-none text-gray-600 flex-shrink-0 hover:bg-gray-400 hover:text-black"
                        on:click|stopPropagation={() =>
                            handleTabClose(tab.session.id)}>×</button
                    >
                </div>
            {/each}
        </div>
    </div>

    <!-- The actual browser views are managed by Electron main process -->
    <div class="flex-1 bg-white flex items-center justify-center">
        {#if $openTabs.length === 0}
            <div class="text-center text-gray-600">
                <div class="text-6xl mb-4">🤖</div>
                <h2 class="text-2xl mb-2 text-gray-800">AI Tools Browser</h2>
                <p class="text-sm text-gray-600">Click on any AI tool above to start a new session</p>
            </div>
        {/if}
    </div>
</div>
