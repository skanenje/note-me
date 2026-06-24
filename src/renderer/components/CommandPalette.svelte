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
    
    const mappedDocs = docs.map(d => ({ type: 'document', id: d.id, title: d.title, icon: '📝', description: 'My Notes' }));
    const mappedTools = tls.map(t => ({ type: 'tool', id: t.id, url: t.url, title: t.name, icon: '🤖', description: t.description || 'AI Tool', toolObj: t }));
    const mappedLessons = lsns.map(l => ({ type: 'lesson', id: l.id, title: l.title, icon: '📚', description: 'Learning Track' }));

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
  <div class="cp-overlay" on:click={onClose}>
    <div class="cp-modal" on:click|stopPropagation>
      <div class="cp-header">
        <span class="cp-search-icon">🔍</span>
        <input 
          bind:this={searchInput}
          bind:value={query}
          on:keydown={handleKeydown}
          class="cp-input" 
          placeholder="Search notes, tools, and tracks..." 
        />
      </div>

      <div class="cp-results">
        {#if filteredItems.length === 0}
          <div class="cp-empty">No results found for "{query}"</div>
        {:else}
          {#each filteredItems as item, i}
            <div 
              id="cp-item-{i}"
              class="cp-item" 
              class:selected={i === selectedIndex}
              on:mouseenter={() => selectedIndex = i}
              on:click={() => executeItem(item)}
            >
              <div class="cp-item-icon">{item.icon}</div>
              <div class="cp-item-body">
                <div class="cp-item-title">{item.title}</div>
                <div class="cp-item-desc">{item.description}</div>
              </div>
              <div class="cp-item-type">{item.type}</div>
            </div>
          {/each}
        {/if}
      </div>
      <div class="cp-footer">
        <span><kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
        <span><kbd>↵</kbd> to select</span>
        <span><kbd>ESC</kbd> to close</span>
      </div>
    </div>
  </div>
{/if}

<style>
  .cp-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding-top: 15vh;
    z-index: 9999;
  }

  .cp-modal {
    width: 100%;
    max-width: 600px;
    background: var(--clr-surface);
    border: 1px solid var(--clr-border);
    border-radius: var(--r-lg);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--clr-border);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: scaleIn 150ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  .cp-header {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--clr-border);
  }

  .cp-search-icon {
    font-size: 1.2rem;
    color: var(--clr-text-muted);
    margin-right: 12px;
  }

  .cp-input {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--clr-text-primary);
    font-size: 1.2rem;
    outline: none;
  }

  .cp-input::placeholder {
    color: var(--clr-text-muted);
  }

  .cp-results {
    max-height: 350px;
    overflow-y: auto;
    padding: 8px;
  }

  .cp-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-radius: var(--r-md);
    cursor: pointer;
    gap: 16px;
  }

  .cp-item.selected {
    background: rgba(124, 58, 237, 0.15);
  }

  .cp-item-icon {
    font-size: 1.5rem;
  }

  .cp-item-body {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .cp-item-title {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--clr-text-primary);
  }

  .cp-item-desc {
    font-size: 0.75rem;
    color: var(--clr-text-muted);
  }

  .cp-item-type {
    font-size: 0.7rem;
    text-transform: uppercase;
    font-weight: 700;
    color: var(--clr-text-muted);
    background: var(--clr-surface2);
    padding: 4px 8px;
    border-radius: var(--r-full);
  }

  .cp-empty {
    padding: 32px;
    text-align: center;
    color: var(--clr-text-muted);
  }

  .cp-footer {
    display: flex;
    justify-content: center;
    gap: 20px;
    padding: 12px;
    background: var(--clr-surface2);
    border-top: 1px solid var(--clr-border);
    font-size: 0.75rem;
    color: var(--clr-text-muted);
  }

  kbd {
    background: var(--clr-bg);
    border: 1px solid var(--clr-border);
    border-radius: 4px;
    padding: 2px 6px;
    font-family: inherit;
    font-weight: 600;
  }
</style>
