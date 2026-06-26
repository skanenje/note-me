<script>
  import { onMount } from 'svelte';
  import { currentDocument } from '../stores/documents.js';
  import { toast } from '../stores/toast.js';
  import PageTreeNode from './PageTreeNode.svelte';

  let tree = [];
  let favorites = [];
  let trash = [];
  let loading = true;
  let showTrash = false;
  let searchQuery = '';
  let allDocs = [];

  async function loadAll() {
    loading = true;
    try {
      // Run all three in parallel; handle each independently
      const [treeRes, favRes, trashRes] = await Promise.allSettled([
        window.api.getDocumentTree(),
        window.api.getFavorites(),
        window.api.getTrash(),
      ]);

      if (treeRes.status === 'fulfilled' && treeRes.value?.success) {
        tree = treeRes.value.tree || [];
        allDocs = flattenTree(tree);
      } else {
        // Fallback: use old getDocuments API which we know works
        console.warn('[Sidebar] getDocumentTree failed, falling back to getDocuments:', treeRes.reason || treeRes.value?.error);
        const fallback = await window.api.getDocuments();
        if (fallback.success) {
          // Treat all as root-level nodes with no children
          allDocs = fallback.documents.map(d => ({ ...d, children: [] }));
          tree = allDocs;
        }
      }

      if (favRes.status === 'fulfilled' && favRes.value?.success) favorites = favRes.value.documents || [];
      if (trashRes.status === 'fulfilled' && trashRes.value?.success) trash = trashRes.value.documents || [];
    } catch (err) {
      console.error('[Sidebar] loadAll error:', err);
    } finally {
      loading = false;
    }
  }

  function flattenTree(nodes, result = []) {
    for (const n of nodes) {
      result.push(n);
      if (n.children?.length) flattenTree(n.children, result);
    }
    return result;
  }

  $: filtered = searchQuery
    ? allDocs.filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : null;

  async function openDoc(docId) {
    const res = await window.api.getDocumentWithBlocks(docId);
    if (res.success) $currentDocument = res.document;
    else toast.error('Failed to open page');
  }

  async function createPage(parentId = null) {
    const res = await window.api.createDocument({ title: 'Untitled', parentId });
    if (res.success) {
      await loadAll();
      await openDoc(res.document.id);
      toast.success('Page created');
    } else {
      toast.error('Failed to create page: ' + res.error);
    }
  }

  async function trashPage(e, docId) {
    e.stopPropagation();
    await window.api.trashDocument(docId);
    if ($currentDocument?.id === docId) $currentDocument = null;
    await loadAll();
    toast.success('Moved to trash');
  }

  async function restorePage(docId) {
    await window.api.restoreDocument(docId);
    await loadAll();
    toast.success('Page restored');
  }

  async function deletePermanent(docId) {
    await window.api.deleteDocument(docId);
    await loadAll();
    toast.success('Permanently deleted');
  }

  async function toggleFavorite(e, docId) {
    e.stopPropagation();
    await window.api.toggleFavorite(docId);
    await loadAll();
  }


  onMount(loadAll);

</script>

<aside class="sidebar">
  <!-- Header -->
  <div class="sidebar__header">
    <div class="sidebar__brand">
      <span class="sidebar__brand-icon">🗒️</span>
      <span class="sidebar__brand-name">Note-Me</span>
    </div>

    <div class="sidebar__search">
      <span class="sidebar__search-icon">🔍</span>
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Search pages…"
        class="sidebar__search-input"
      />
    </div>
  </div>

  <!-- New page button -->
  <button class="sidebar__new-btn" on:click={() => createPage(null)}>
    <span>+</span> New Page
  </button>

  <div class="sidebar__scroll">
    <!-- Search results override -->
    {#if filtered !== null}
      <div class="sidebar__section-label">Search Results</div>
      {#if filtered.length === 0}
        <div class="sidebar__empty">No pages found</div>
      {:else}
        {#each filtered as doc}
          <button
            class="sidebar__item"
            class:sidebar__item--active={$currentDocument?.id === doc.id}
            on:click={() => openDoc(doc.id)}
          >
            <span class="sidebar__item-icon">{doc.icon || '📄'}</span>
            <span class="sidebar__item-title">{doc.title || 'Untitled'}</span>
          </button>
        {/each}
      {/if}

    {:else}

      <!-- Favorites -->
      {#if favorites.length > 0}
        <div class="sidebar__section-label">⭐ Favorites</div>
        {#each favorites as doc}
          <button
            class="sidebar__item"
            class:sidebar__item--active={$currentDocument?.id === doc.id}
            on:click={() => openDoc(doc.id)}
          >
            <span class="sidebar__item-icon">{doc.icon || '📄'}</span>
            <span class="sidebar__item-title">{doc.title || 'Untitled'}</span>
            <button class="sidebar__item-action sidebar__item-action--gold" title="Remove from favorites" on:click={(e) => toggleFavorite(e, doc.id)}>★</button>
          </button>
        {/each}
        <div class="sidebar__divider"></div>
      {/if}

      <!-- Page tree -->
      <div class="sidebar__section-label">
        Pages
        <button class="sidebar__section-action" on:click={() => createPage(null)} title="New root page">+</button>
      </div>

      {#if loading}
        {#each [1,2,3] as _}
          <div class="sidebar__skeleton"></div>
        {/each}
      {:else if tree.length === 0}
        <div class="sidebar__empty">
          <p>No pages yet</p>
          <button class="sidebar__empty-create" on:click={() => createPage(null)}>Create first page</button>
        </div>
      {:else}
        {#each tree as node}
          <PageTreeNode
            {node}
            depth={0}
            activeId={$currentDocument?.id}
            on:open={(e) => openDoc(e.detail.id)}
            on:create={(e) => createPage(e.detail.parentId)}
            on:trash={(e) => trashPage({ stopPropagation: () => {} }, e.detail.id)}
            on:favorite={(e) => toggleFavorite({ stopPropagation: () => {} }, e.detail.id)}
          />
        {/each}
      {/if}

      <!-- Trash -->
      <div class="sidebar__divider"></div>
      <button class="sidebar__trash-toggle" on:click={() => showTrash = !showTrash}>
        🗑 Trash {trash.length > 0 ? `(${trash.length})` : ''} {showTrash ? '▾' : '▸'}
      </button>
      {#if showTrash}
        {#if trash.length === 0}
          <div class="sidebar__empty">Trash is empty</div>
        {:else}
          {#each trash as doc}
            <div class="sidebar__trash-item">
              <span class="sidebar__item-icon">{doc.icon || '📄'}</span>
              <span class="sidebar__item-title">{doc.title || 'Untitled'}</span>
              <button class="sidebar__item-action" title="Restore" on:click={() => restorePage(doc.id)}>↩</button>
              <button class="sidebar__item-action sidebar__item-action--danger" title="Delete permanently" on:click={() => deletePermanent(doc.id)}>✕</button>
            </div>
          {/each}
        {/if}
      {/if}
    {/if}
  </div>
</aside>

<style>
  .sidebar {
    width: 260px;
    flex-shrink: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--clr-surface);
    border-right: 1px solid var(--clr-border);
    overflow: hidden;
  }

  .sidebar__header {
    padding: 16px 14px 10px;
    flex-shrink: 0;
  }

  .sidebar__brand {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  .sidebar__brand-icon { font-size: 1.2rem; }

  .sidebar__brand-name {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--clr-text-primary);
  }

  .sidebar__search {
    position: relative;
  }

  .sidebar__search-icon {
    position: absolute;
    left: 8px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.75rem;
    pointer-events: none;
    opacity: 0.5;
  }

  .sidebar__search-input {
    width: 100%;
    background: var(--clr-surface2);
    border: 1px solid var(--clr-border);
    border-radius: var(--r-md);
    padding: 6px 10px 6px 28px;
    font-size: 0.82rem;
    color: var(--clr-text-primary);
    outline: none;
    transition: border-color 0.15s;
    font-family: inherit;
  }

  .sidebar__search-input:focus { border-color: var(--clr-accent); }
  .sidebar__search-input::placeholder { color: var(--clr-text-muted); opacity: 0.7; }

  .sidebar__new-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 10px 8px;
    padding: 7px 12px;
    background: var(--grad-primary);
    color: white;
    border: none;
    border-radius: var(--r-md);
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.15s;
    font-family: inherit;
  }
  .sidebar__new-btn:hover { opacity: 0.9; transform: translateY(-1px); }

  .sidebar__scroll {
    flex: 1;
    overflow-y: auto;
    padding: 4px 8px 24px;
  }

  .sidebar__section-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--clr-text-muted);
    padding: 10px 6px 4px;
  }

  .sidebar__section-action {
    background: none;
    border: none;
    color: var(--clr-text-muted);
    cursor: pointer;
    font-size: 1rem;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--r-sm);
    transition: background 0.1s, color 0.1s;
  }
  .sidebar__section-action:hover { background: var(--clr-surface2); color: var(--clr-text-primary); }

  .sidebar__item {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 6px 8px;
    border: none;
    background: transparent;
    border-radius: var(--r-md);
    cursor: pointer;
    text-align: left;
    transition: background 0.1s;
    color: var(--clr-text-secondary);
    font-size: 0.85rem;
    font-family: inherit;
  }

  .sidebar__item:hover { background: var(--clr-surface2); color: var(--clr-text-primary); }
  .sidebar__item--active { background: rgba(139,92,246,0.15); color: var(--clr-accent) !important; font-weight: 600; }

  .sidebar__item-icon { flex-shrink: 0; font-size: 0.9rem; }
  .sidebar__item-title { flex: 1; truncate: true; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .sidebar__item-action {
    flex-shrink: 0;
    opacity: 0;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.75rem;
    padding: 2px 4px;
    border-radius: 4px;
    color: var(--clr-text-muted);
    transition: background 0.1s, color 0.1s, opacity 0.1s;
  }
  .sidebar__item:hover .sidebar__item-action,
  .sidebar__trash-item:hover .sidebar__item-action { opacity: 1; }
  .sidebar__item-action:hover { background: var(--clr-surface); color: var(--clr-text-primary); }
  .sidebar__item-action--danger:hover { color: #f87171; }
  .sidebar__item-action--gold { color: #fbbf24; opacity: 0.8; }
  .sidebar__item-action--gold:hover { color: #f59e0b; }

  .sidebar__skeleton {
    height: 32px;
    background: var(--clr-surface2);
    border-radius: var(--r-md);
    margin-bottom: 4px;
    animation: pulse 1.5s ease-in-out infinite;
  }
  @keyframes pulse { 0%,100% { opacity: 0.5; } 50% { opacity: 0.3; } }

  .sidebar__empty {
    padding: 16px 8px;
    text-align: center;
    font-size: 0.8rem;
    color: var(--clr-text-muted);
  }

  .sidebar__empty-create {
    display: inline-block;
    margin-top: 8px;
    padding: 5px 14px;
    background: var(--clr-surface2);
    border: 1px solid var(--clr-border);
    border-radius: var(--r-full);
    font-size: 0.78rem;
    color: var(--clr-text-secondary);
    cursor: pointer;
    transition: all 0.15s;
    font-family: inherit;
  }
  .sidebar__empty-create:hover { border-color: var(--clr-accent); color: var(--clr-accent); }

  .sidebar__divider {
    height: 1px;
    background: var(--clr-border);
    margin: 10px 4px;
  }

  .sidebar__trash-toggle {
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.8rem;
    color: var(--clr-text-muted);
    padding: 6px 8px;
    border-radius: var(--r-md);
    transition: background 0.1s;
    font-family: inherit;
  }
  .sidebar__trash-toggle:hover { background: var(--clr-surface2); color: var(--clr-text-primary); }

  .sidebar__trash-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    border-radius: var(--r-md);
    font-size: 0.82rem;
    color: var(--clr-text-muted);
  }
  .sidebar__trash-item:hover { background: var(--clr-surface2); }
</style>
