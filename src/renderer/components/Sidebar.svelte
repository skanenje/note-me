<script>
  import {
    documents,
    currentDocument,
    documentsLoading,
    createDocument,
    selectDocument,
    deleteDocument,
  } from "../stores/documents.js";
  import { toast } from "../stores/toast.js";

  let newTitle = "";
  let showInput = false;
  let deletingId = null;
  let inputEl;
  let searchQuery = "";

  $: filteredDocs = $documents.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function handleCreate() {
    if (!newTitle.trim()) return;
    try {
      const doc = await createDocument(newTitle.trim());
      newTitle = "";
      showInput = false;
      await selectDocument(doc.id);
      toast.success("Page created");
    } catch (error) {
      toast.error("Failed to create page: " + error.message);
    }
  }

  async function handleSelect(docId) {
    try {
      await selectDocument(docId);
    } catch (err) {
      toast.error("Failed to open page: " + err.message);
    }
  }

  async function handleDelete(e, docId) {
    e.stopPropagation();
    deletingId = docId;
    try {
      await deleteDocument(docId);
      toast.success("Page deleted");
    } catch (err) {
      toast.error("Failed to delete: " + err.message);
    } finally {
      deletingId = null;
    }
  }

  function handleShowInput() {
    showInput = true;
    setTimeout(() => inputEl?.focus(), 50);
  }
</script>

<aside class="sidebar">
  <!-- Header -->
  <div class="sidebar__header">
    <span class="sidebar__title">My Notes</span>
    <span class="sidebar__count">{$documents.length}</span>
  </div>

  <div class="sidebar__search">
    <input 
      type="text" 
      bind:value={searchQuery} 
      placeholder="Search notes..." 
      class="search-input"
    />
  </div>

  <!-- New Page -->
  {#if !showInput}
    <button class="new-page-btn" on:click={handleShowInput}>
      <span class="new-page-btn__icon">+</span>
      New Page
    </button>
  {:else}
    <div class="new-page-input-wrap">
      <input
        bind:this={inputEl}
        type="text"
        bind:value={newTitle}
        placeholder="Page title…"
        class="new-page-input"
        on:keydown={(e) => {
          if (e.key === "Enter") handleCreate();
          if (e.key === "Escape") { showInput = false; newTitle = ""; }
        }}
        on:blur={() => { if (!newTitle.trim()) { showInput = false; } }}
      />
      <div class="new-page-input-hint">Enter to save · Esc to cancel</div>
    </div>
  {/if}

  <!-- Documents list -->
  <div class="doc-list">
    {#if $documentsLoading}
      {#each [1,2,3] as _}
        <div class="doc-skeleton skeleton"></div>
      {/each}
    {:else if filteredDocs.length === 0}
      <div class="doc-list__empty">
        <span class="doc-list__empty-icon">📄</span>
        <p>No matches found</p>
      </div>
    {:else}
      {#each filteredDocs as doc (doc.id)}
        <button
          class="doc-item"
          class:doc-item--active={$currentDocument?.id === doc.id}
          on:click={() => handleSelect(doc.id)}
        >
          <span class="doc-item__icon">📄</span>
          <span class="doc-item__title">{doc.title}</span>
          <button
            class="doc-item__delete"
            aria-label="Delete page"
            on:click={(e) => handleDelete(e, doc.id)}
            disabled={deletingId === doc.id}
          >
            {deletingId === doc.id ? '…' : '🗑'}
          </button>
        </button>
      {/each}
    {/if}
  </div>
</aside>

<style>
  .sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--clr-surface);
    border-right: 1px solid var(--clr-border);
    padding: 16px 10px;
    overflow: hidden;
  }

  .sidebar__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 8px 12px;
  }

  .sidebar__title {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--clr-text-muted);
  }

  .sidebar__count {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--clr-text-muted);
    background: var(--clr-surface2);
    padding: 2px 6px;
    border-radius: var(--r-full);
  }

  .sidebar__search {
    margin-bottom: 12px;
    padding: 0 4px;
  }

  .search-input {
    width: 100%;
    padding: 6px 10px;
    background: var(--clr-bg);
    border: 1px solid var(--clr-border);
    border-radius: var(--r-md);
    color: var(--clr-text-primary);
    font-size: 0.8rem;
    outline: none;
    transition: all var(--t-fast);
  }

  .search-input:focus {
    border-color: var(--clr-accent);
    box-shadow: 0 0 0 2px var(--clr-accent-glow);
  }

  .new-page-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 10px;
    margin-bottom: 8px;
    border-radius: var(--r-md);
    border: 1px dashed var(--clr-border);
    background: transparent;
    color: var(--clr-text-muted);
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--t-fast);
    font-family: inherit;
  }

  .new-page-btn:hover {
    border-color: var(--clr-accent);
    background: rgba(124, 58, 237, 0.08);
    color: #c4b5fd;
  }

  .new-page-btn__icon {
    font-size: 1rem;
    font-weight: 300;
    line-height: 1;
  }

  .new-page-input-wrap {
    margin-bottom: 8px;
  }

  .new-page-input {
    width: 100%;
    padding: 8px 10px;
    background: var(--clr-surface2);
    border: 1px solid var(--clr-accent);
    border-radius: var(--r-md);
    color: var(--clr-text-primary);
    font-size: 0.85rem;
    box-shadow: 0 0 0 3px var(--clr-accent-glow);
    outline: none;
  }

  .new-page-input-hint {
    font-size: 0.7rem;
    color: var(--clr-text-muted);
    padding: 4px 4px 0;
  }

  .doc-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .doc-skeleton {
    height: 36px;
    border-radius: var(--r-md);
    margin-bottom: 2px;
  }

  .doc-list__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 40px 12px;
    text-align: center;
  }

  .doc-list__empty-icon { font-size: 2rem; opacity: 0.3; }
  .doc-list__empty p:first-of-type {
    font-size: 0.85rem;
    color: var(--clr-text-secondary);
    font-weight: 500;
  }
  .doc-list__empty p:last-of-type {
    font-size: 0.75rem;
    color: var(--clr-text-muted);
  }

  .doc-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 10px;
    border-radius: var(--r-md);
    border: none;
    background: transparent;
    color: var(--clr-text-secondary);
    font-size: 0.85rem;
    cursor: pointer;
    transition: all var(--t-fast);
    text-align: left;
    font-family: inherit;
  }

  .doc-item:hover {
    background: var(--clr-surface2);
    color: var(--clr-text-primary);
  }

  .doc-item--active {
    background: rgba(124, 58, 237, 0.12);
    color: #c4b5fd;
    font-weight: 500;
  }

  .doc-item__icon { font-size: 0.85rem; flex-shrink: 0; }

  .doc-item__title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .doc-item__delete {
    background: transparent;
    border: none;
    font-size: 0.8rem;
    cursor: pointer;
    opacity: 0;
    padding: 2px 4px;
    border-radius: 4px;
    transition: all var(--t-fast);
    color: var(--clr-text-muted);
    flex-shrink: 0;
  }

  .doc-item:hover .doc-item__delete {
    opacity: 1;
  }

  .doc-item__delete:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #fca5a5;
  }
</style>
