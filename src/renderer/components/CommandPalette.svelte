<script>
  import { onMount, onDestroy } from "svelte";
  import { documents, selectDocument } from "../stores/documents.js";
  import { tools, createNewTab, switchTab, openTabs } from "../stores/aitools.js";

  export let show = false;
  export let onClose;
  export let onNavigate;
  export let onSelectLesson;

  let query = "";
  let searchInput;
  let selectedIndex = 0;

  let allLessons = [];

  // Fetch lessons on mount to cache them for search
  onMount(async () => {
    try {
      const res = await window.api.getLessons();
      if (res.success) allLessons = res.lessons;
    } catch (err) {
      console.error("CommandPalette: failed to load lessons", err);
    }
  });

  $: if (show && searchInput) {
    query = "";
    selectedIndex = 0;
    setTimeout(() => searchInput.focus(), 50);
  }

  // Combine and filter items based on query
  $: filteredItems = getFilteredItems(query, $documents, $tools, allLessons);

  function getFilteredItems(q, docs, tls, lsns) {
    const term = q.toLowerCase().trim();
    
    const mappedDocs = docs.map(d => ({ type: 'document', id: d.id, title: d.title, icon: 'edit_note', description: 'My Notes' }));
    const mappedTools = tls.map(t => ({ type: 'tool', id: t.id, url: t.url, title: t.name, icon: 'smart_toy', description: t.description || 'AI Tool', toolObj: t }));
    const mappedLessons = lsns.map(l => ({ type: 'lesson', id: l.id, title: l.title, icon: 'school', description: 'Learning Track' }));

    const all = [...mappedDocs, ...mappedTools, ...mappedLessons];
    
    if (!term) return all.slice(0, 8); // show some default items

    return all.filter(item => 
      item.title.toLowerCase().includes(term) || 
      item.description.toLowerCase().includes(term)
    ).slice(0, 10);
  }

  $: {
    // Reset selection if query changes and results change
    if (query !== undefined && filteredItems.length > 0) {
      if (selectedIndex >= filteredItems.length) selectedIndex = 0;
    }
  }

  function handleKeydown(e) {
    if (e.key === "Escape") {
      onClose();
      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      selectedIndex = (selectedIndex + 1) % filteredItems.length;
      e.preventDefault();
      scrollIntoView();
    } else if (e.key === "ArrowUp") {
      selectedIndex = (selectedIndex - 1 + filteredItems.length) % filteredItems.length;
      e.preventDefault();
      scrollIntoView();
    } else if (e.key === "Enter") {
      if (filteredItems[selectedIndex]) {
        executeItem(filteredItems[selectedIndex]);
      }
      e.preventDefault();
    }
  }

  function scrollIntoView() {
    const el = document.getElementById(`cp-item-${selectedIndex}`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }

  async function executeItem(item) {
    onClose();
    if (item.type === 'document') {
      await onNavigate('documents');
      selectDocument(item.id);
    } else if (item.type === 'tool') {
      await onNavigate('aitools');
      // check if it's already open
      let tabs;
      openTabs.subscribe(t => tabs = t)();
      const existing = tabs.find(tab => tab.tool.id === item.id);
      if (existing) {
        switchTab(existing.session.id);
      } else {
        createNewTab(item.toolObj);
      }
    } else if (item.type === 'lesson') {
      await onNavigate('lessons');
      onSelectLesson(item.id);
    }
  }
</script>

{#if show}
  <div class="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-start justify-center pt-[15vh]" on:click={onClose}>
    <div class="w-full max-w-2xl bg-surface border border-outline-variant rounded-xl shadow-2xl overflow-hidden flex flex-col" on:click|stopPropagation>
      
      <!-- Header / Search Input -->
      <div class="flex items-center px-lg py-md border-b border-outline-variant gap-md">
        <span class="material-symbols-outlined text-on-surface-variant text-[24px]">search</span>
        <input 
          bind:this={searchInput}
          bind:value={query}
          on:keydown={handleKeydown}
          class="flex-1 bg-transparent border-none text-h2 text-on-surface focus:outline-none placeholder:text-on-surface-variant/50" 
          placeholder="Search notes, tools, and tracks..." 
          type="text"
        />
      </div>

      <!-- Results List -->
      <div class="max-h-[400px] overflow-y-auto p-sm flex flex-col gap-xs custom-scrollbar">
        {#if filteredItems.length === 0}
          <div class="p-8 text-center text-on-surface-variant">No results found for "{query}"</div>
        {:else}
          {#each filteredItems as item, i}
            <div 
              id="cp-item-{i}"
              class="flex items-center gap-md p-md rounded-lg cursor-pointer transition-colors"
              class:bg-primary={i === selectedIndex}
              class:bg-opacity-10={i === selectedIndex}
              class:hover:bg-surface-container-high={i !== selectedIndex}
              on:mouseenter={() => selectedIndex = i}
              on:click={() => executeItem(item)}
            >
              <span class="material-symbols-outlined text-[24px]" class:text-primary={i === selectedIndex} class:text-on-surface-variant={i !== selectedIndex}>
                {item.icon}
              </span>
              
              <div class="flex flex-col flex-1">
                <span class="text-on-surface font-semibold">{item.title}</span>
                <span class="text-on-surface-variant text-sm">{item.description}</span>
              </div>
              
              <span class="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded"
                    class:text-primary={i === selectedIndex}
                    class:bg-primary={i === selectedIndex}
                    class:bg-opacity-20={i === selectedIndex}
                    class:text-on-surface-variant={i !== selectedIndex}
                    class:bg-surface-container-highest={i !== selectedIndex}
              >
                {item.type}
              </span>
            </div>
          {/each}
        {/if}
      </div>

      <!-- Footer -->
      <div class="bg-surface-container-low px-lg py-sm border-t border-outline-variant flex items-center justify-between text-xs text-on-surface-variant">
        <div class="flex gap-lg">
          <span class="flex items-center gap-xs">
            <kbd class="bg-surface border border-outline-variant rounded px-1 font-mono text-[10px]">↑</kbd> 
            <kbd class="bg-surface border border-outline-variant rounded px-1 font-mono text-[10px]">↓</kbd> 
            to navigate
          </span>
          <span class="flex items-center gap-xs">
            <kbd class="bg-surface border border-outline-variant rounded px-1 font-mono text-[10px]">↵</kbd> 
            to select
          </span>
        </div>
        <span class="flex items-center gap-xs">
          <kbd class="bg-surface border border-outline-variant rounded px-1 font-mono text-[10px]">ESC</kbd> 
          to close
        </span>
      </div>
    </div>
  </div>
{/if}
