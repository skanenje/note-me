<script>
  import { createEventDispatcher, tick } from 'svelte';
  export let node;
  export let depth = 0;
  export let activeId = null;

  const dispatch = createEventDispatcher();
  let expanded = false;

  // ── Inline rename ──────────────────────────────────────────────────────────
  let renaming = false;
  let renameValue = '';
  let renameEl;

  async function startRename(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    renameValue = node.title || '';
    renaming = true;
    await tick();
    if (renameEl) {
      renameEl.focus();
      renameEl.select();
    }
  }

  function commitRename() {
    const title = renameValue.trim() || 'Untitled';
    renaming = false;
    if (title !== node.title) {
      dispatch('rename', { id: node.id, title });
    }
  }

  function handleRenameKeydown(e) {
    if (e.key === 'Enter') { e.preventDefault(); commitRename(); }
    else if (e.key === 'Escape') { renaming = false; }
  }

  $: hasChildren = node.children && node.children.length > 0;
</script>

<div class="tree-node" style="padding-left: {depth * 14}px">
  <div
    class="tree-node__row"
    class:tree-node__row--active={activeId === node.id}
    role="button"
    tabindex="0"
    on:click={() => !renaming && dispatch('open', { id: node.id })}
    on:keydown={(e) => e.key === 'Enter' && !renaming && dispatch('open', { id: node.id })}
    on:dblclick={startRename}
  >
    <!-- Expand toggle -->
    <button
      class="tree-node__expand"
      on:click|stopPropagation={() => expanded = !expanded}
      style="opacity: {hasChildren ? 1 : 0}; pointer-events: {hasChildren ? 'all' : 'none'}"
    >
      {expanded ? '▾' : '▸'}
    </button>

    <span class="tree-node__icon">{node.icon || '📄'}</span>

    {#if renaming}
      <!-- Inline rename input -->
      <input
        bind:this={renameEl}
        bind:value={renameValue}
        class="tree-node__rename-input"
        on:blur={commitRename}
        on:keydown={handleRenameKeydown}
        on:click|stopPropagation
      />
    {:else}
      <span class="tree-node__title" title="Double-click to rename">{node.title || 'Untitled'}</span>
    {/if}

    <!-- Actions (hover) -->
    {#if !renaming}
      <div class="tree-node__actions">
        <button
          class="tree-node__btn"
          title="Rename (double-click)"
          on:click|stopPropagation={startRename}
        >✎</button>
        <button
          class="tree-node__btn"
          title="New subpage"
          on:click|stopPropagation={() => dispatch('create', { parentId: node.id })}
        >+</button>
        <button
          class="tree-node__btn tree-node__btn--danger"
          title="Move to trash"
          on:click|stopPropagation={() => dispatch('trash', { id: node.id })}
        >🗑</button>
        <button
          class="tree-node__btn"
          title={node.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
          on:click|stopPropagation={() => dispatch('favorite', { id: node.id })}
          style="color: {node.is_favorite ? '#fbbf24' : 'inherit'}"
        >★</button>
      </div>
    {/if}
  </div>

  {#if expanded && hasChildren}
    <div class="tree-node__children">
      {#each node.children as child}
        <svelte:self
          node={child}
          depth={depth + 1}
          {activeId}
          on:open
          on:create
          on:trash
          on:favorite
          on:rename
        />
      {/each}
    </div>
  {/if}
</div>

<style>
  .tree-node { width: 100%; }

  .tree-node__row {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 5px 6px 5px 0;
    border-radius: var(--r-md);
    cursor: pointer;
    color: var(--clr-text-secondary);
    font-size: 0.84rem;
    transition: background 0.1s, color 0.1s;
    position: relative;
  }
  .tree-node__row:hover { background: var(--clr-surface2); color: var(--clr-text-primary); }
  .tree-node__row--active { background: rgba(139,92,246,0.15); color: var(--clr-accent) !important; font-weight: 600; }

  .tree-node__expand {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.6rem;
    color: var(--clr-text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 3px;
    transition: background 0.1s;
  }
  .tree-node__expand:hover { background: var(--clr-border); }

  .tree-node__icon { flex-shrink: 0; font-size: 0.85rem; }
  .tree-node__title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  /* Inline rename */
  .tree-node__rename-input {
    flex: 1;
    min-width: 0;
    background: var(--clr-bg);
    border: 1px solid var(--clr-accent);
    border-radius: var(--r-sm);
    padding: 1px 6px;
    font-size: 0.84rem;
    color: var(--clr-text-primary);
    outline: none;
    font-family: inherit;
  }

  .tree-node__actions {
    display: flex;
    gap: 2px;
    opacity: 0;
    transition: opacity 0.1s;
    margin-left: auto;
    flex-shrink: 0;
  }
  .tree-node__row:hover .tree-node__actions { opacity: 1; }

  .tree-node__btn {
    width: 20px;
    height: 20px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.65rem;
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--clr-text-muted);
    transition: background 0.1s, color 0.1s;
  }
  .tree-node__btn:hover { background: var(--clr-border); color: var(--clr-text-primary); }
  .tree-node__btn--danger:hover { color: #f87171; }

  .tree-node__children { margin-top: 2px; }
</style>
