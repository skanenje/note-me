<script>
  import { tick } from 'svelte';
  import { currentDocument, updateDocumentTitle } from '../stores/documents.js';
  import { toast } from '../stores/toast.js';
  import Block from './Block.svelte';
  import FloatingToolbar from './FloatingToolbar.svelte';

  let titleEl;
  let editorEl;
  let focusedBlockId = null;
  let toolbarSelection = null;
  let selectionTimer;
  let saving = false;

  // ── Document meta ──────────────────────────────────────────────────────────
  async function handleTitleKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Move focus to first block or create one
      const blocks = $currentDocument?.blocks || [];
      if (blocks.length === 0) await createBlockAtEnd('paragraph');
      else focusedBlockId = blocks[0].id;
    }
  }

  async function handleTitleBlur() {
    if (!$currentDocument || !titleEl) return;
    const title = titleEl.innerText.trim() || 'Untitled';
    if (title !== $currentDocument.title) {
      try { await updateDocumentTitle($currentDocument.id, title); }
      catch { toast.error('Failed to save title'); }
    }
  }

  async function changeIcon(newIcon) {
    if (!$currentDocument) return;
    await window.api.updateDocumentMeta({ documentId: $currentDocument.id, icon: newIcon });
    $currentDocument = { ...$currentDocument, icon: newIcon };
  }

  // Emoji picker state (quick inline)
  let showEmojiPicker = false;
  const QUICK_EMOJIS = ['📄','📝','📋','📌','🗒️','✅','🔥','⭐','💡','🚀','📊','🎯','🔑','🌟','💎','🎨','🛠️','📂','🏆','❤️'];

  // ── Floating text-selection toolbar ────────────────────────────────────────
  function handleSelectionChange() {
    clearTimeout(selectionTimer);
    selectionTimer = setTimeout(() => {
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect.width > 0) {
          toolbarSelection = {
            x: rect.left + rect.width / 2 - 140,
            y: rect.top,
          };
        } else {
          toolbarSelection = null;
        }
      } else {
        toolbarSelection = null;
      }
    }, 150);
  }

  // ── Block CRUD ─────────────────────────────────────────────────────────────
  async function reloadDoc() {
    if (!$currentDocument) return;
    const result = await window.api.getDocumentWithBlocks($currentDocument.id);
    if (result.success) $currentDocument = result.document;
  }

  async function createBlockAtEnd(type = 'paragraph') {
    if (!$currentDocument) return;
    const res = await window.api.createBlock({ documentId: $currentDocument.id, type, content: '' });
    if (res.success) {
      await reloadDoc();
      await tick();
      focusedBlockId = res.block.id;
    }
  }

  async function handleCreateAfter({ detail }) {
    if (!$currentDocument) return;
    saving = true;
    try {
      const res = await window.api.createBlock({
        documentId: $currentDocument.id,
        type: detail.type || 'paragraph',
        content: '',
        afterBlockId: detail.blockId,
      });
      if (res.success) {
        await reloadDoc();
        await tick();
        focusedBlockId = res.block.id;
      }
    } finally { saving = false; }
  }

  async function handleDelete({ detail }) {
    if (!$currentDocument) return;
    const blocks = $currentDocument.blocks;
    const idx = blocks.findIndex(b => b.id === detail.blockId);
    const prevId = idx > 0 ? blocks[idx - 1].id : null;
    const res = await window.api.deleteBlock(detail.blockId);
    if (res.success) {
      await reloadDoc();
      await tick();
      if (prevId) focusedBlockId = prevId;
    }
  }

  async function handleUpdate({ detail }) {
    await window.api.updateBlock({ blockId: detail.blockId, content: detail.content, metadata: detail.metadata });
    // Silently update local state without full reload (avoid cursor jumps)
    if ($currentDocument) {
      $currentDocument = {
        ...$currentDocument,
        blocks: $currentDocument.blocks.map(b =>
          b.id === detail.blockId ? { ...b, content: detail.content || b.content, metadata: detail.metadata || b.metadata } : b
        )
      };
    }
  }

  async function handleChangeType({ detail }) {
    const res = await window.api.updateBlockType({ blockId: detail.blockId, type: detail.type });
    if (res.success) {
      await reloadDoc();
      await tick();
      focusedBlockId = detail.blockId;
    }
  }

  async function handleMove({ detail }) {
    const res = await window.api.moveBlock({ blockId: detail.fromId, newPosition: detail.toPosition });
    if (res.success) await reloadDoc();
  }

  async function handleIndent({ detail }) {
    await window.api.updateBlockIndent({ blockId: detail.blockId, indent: detail.indent });
    if ($currentDocument) {
      $currentDocument = {
        ...$currentDocument,
        blocks: $currentDocument.blocks.map(b =>
          b.id === detail.blockId ? { ...b, indent: detail.indent } : b
        )
      };
    }
  }

  async function handleDuplicate({ detail }) {
    if (!$currentDocument) return;
    const block = $currentDocument.blocks.find(b => b.id === detail.blockId);
    if (!block) return;
    const res = await window.api.createBlock({
      documentId: $currentDocument.id,
      type: block.type,
      content: block.content,
      afterBlockId: block.id,
      metadata: block.metadata,
    });
    if (res.success) await reloadDoc();
  }

  // ── Word count & stats ─────────────────────────────────────────────────────
  $: wordCount = $currentDocument?.blocks?.reduce((acc, b) => {
    const text = b.content?.replace(/<[^>]+>/g, '') || '';
    return acc + text.split(/\s+/).filter(Boolean).length;
  }, 0) || 0;

  $: readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Reset focused block when document changes
  $: if ($currentDocument) { focusedBlockId = null; }
</script>

<svelte:window on:selectionchange={handleSelectionChange} on:mousedown={() => { if (!toolbarSelection) toolbarSelection = null; }} />

<FloatingToolbar selection={toolbarSelection} />

<div class="editor" bind:this={editorEl}>
  {#if !$currentDocument}
    <!-- Empty state -->
    <div class="editor__empty">
      <div class="editor__empty-icon">🗒️</div>
      <h2 class="editor__empty-title">No page selected</h2>
      <p class="editor__empty-sub">Pick a page from the sidebar or create a new one to get started</p>
    </div>

  {:else}
    <div class="editor__page">
      <!-- Cover image (if set) -->
      {#if $currentDocument.cover}
        <div class="editor__cover" style="background: {$currentDocument.cover}">
          <button class="editor__cover-remove" on:click={() => window.api.updateDocumentMeta({ documentId: $currentDocument.id, cover: null })}>
            Remove cover
          </button>
        </div>
      {:else}
        <div class="editor__cover-add-zone">
          <button class="editor__cover-add-btn" on:click={() => {
            const gradients = ['linear-gradient(135deg,#667eea,#764ba2)', 'linear-gradient(135deg,#f093fb,#f5576c)', 'linear-gradient(135deg,#4facfe,#00f2fe)', 'linear-gradient(135deg,#43e97b,#38f9d7)', 'linear-gradient(135deg,#fa709a,#fee140)'];
            const g = gradients[Math.floor(Math.random() * gradients.length)];
            window.api.updateDocumentMeta({ documentId: $currentDocument.id, cover: g });
            $currentDocument = { ...$currentDocument, cover: g };
          }}>
            + Add Cover
          </button>
        </div>
      {/if}

      <div class="editor__content">
        <!-- Page icon -->
        <div class="editor__icon-wrap">
          <button
            class="editor__icon"
            title="Change icon"
            on:click={() => showEmojiPicker = !showEmojiPicker}
          >{$currentDocument.icon || '📄'}</button>

          {#if showEmojiPicker}
            <div class="emoji-picker">
              {#each QUICK_EMOJIS as emoji}
                <button class="emoji-picker__item" on:click={() => { changeIcon(emoji); showEmojiPicker = false; }}>
                  {emoji}
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Title -->
        <h1
          bind:this={titleEl}
          contenteditable="true"
          class="editor__title"
          data-placeholder="Untitled"
          on:keydown={handleTitleKeydown}
          on:blur={handleTitleBlur}
          spellcheck="true"
        >{$currentDocument.title}</h1>

        <!-- Meta row -->
        <div class="editor__meta">
          <span>{wordCount} words · {readingTime} min read</span>
          <span>Edited {new Date($currentDocument.updated_at).toLocaleString()}</span>
        </div>

        <!-- Blocks area -->
        <div class="editor__blocks" role="list">
          {#each $currentDocument.blocks as block (block.id)}
            <Block
              {block}
              isFocused={focusedBlockId === block.id}
              on:update={handleUpdate}
              on:delete={handleDelete}
              on:createAfter={handleCreateAfter}
              on:changeType={handleChangeType}
              on:move={handleMove}
              on:indent={handleIndent}
              on:duplicate={handleDuplicate}
              on:focus={(e) => focusedBlockId = e.detail.blockId}
            />
          {/each}

          <!-- Click-to-add area -->
          <button
            class="editor__add-block"
            on:click={() => createBlockAtEnd('paragraph')}
          >
            <span class="editor__add-block-icon">+</span>
            <span>Click to add a block, or type <kbd>/</kbd> in any empty block</span>
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .editor {
    height: 100%;
    overflow-y: auto;
    background: var(--clr-bg);
    scroll-behavior: smooth;
  }

  /* Empty state */
  .editor__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 12px;
    text-align: center;
    padding: 40px;
  }
  .editor__empty-icon { font-size: 4rem; opacity: 0.12; }
  .editor__empty-title { font-size: 1.3rem; font-weight: 600; color: var(--clr-text-secondary); }
  .editor__empty-sub { font-size: 0.9rem; color: var(--clr-text-muted); max-width: 320px; line-height: 1.6; }

  /* Page layout */
  .editor__page { min-height: 100%; }

  /* Cover */
  .editor__cover {
    position: relative;
    height: 180px;
    width: 100%;
    border-radius: 0;
  }
  .editor__cover-remove {
    position: absolute;
    bottom: 10px;
    right: 16px;
    background: rgba(0,0,0,0.5);
    color: white;
    border: none;
    border-radius: var(--r-sm);
    padding: 4px 10px;
    font-size: 0.75rem;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s;
  }
  .editor__cover:hover .editor__cover-remove { opacity: 1; }

  .editor__cover-add-zone {
    height: 32px;
    display: flex;
    align-items: center;
    padding: 0 64px;
  }
  .editor__cover-add-btn {
    font-size: 0.75rem;
    color: var(--clr-text-muted);
    background: none;
    border: none;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s;
    padding: 4px 8px;
    border-radius: var(--r-sm);
  }
  .editor__cover-add-zone:hover .editor__cover-add-btn { opacity: 1; }
  .editor__cover-add-btn:hover { background: var(--clr-surface); color: var(--clr-text-secondary); }

  /* Content column */
  .editor__content {
    max-width: 720px;
    margin: 0 auto;
    padding: 24px 64px 120px;
  }

  /* Icon */
  .editor__icon-wrap { position: relative; margin-bottom: 16px; }
  .editor__icon {
    font-size: 3.5rem;
    background: none;
    border: none;
    cursor: pointer;
    border-radius: var(--r-md);
    padding: 4px 8px;
    margin: -4px -8px;
    transition: background 0.15s;
    line-height: 1;
  }
  .editor__icon:hover { background: var(--clr-surface); }

  /* Emoji picker */
  .emoji-picker {
    position: absolute;
    top: 56px;
    left: 0;
    z-index: 200;
    background: var(--clr-surface);
    border: 1px solid var(--clr-border);
    border-radius: var(--r-lg);
    padding: 10px;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 4px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    animation: popIn 0.15s cubic-bezier(0.16,1,0.3,1);
  }
  @keyframes popIn {
    from { opacity: 0; transform: scale(0.9) translateY(-8px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  .emoji-picker__item {
    width: 36px;
    height: 36px;
    font-size: 1.3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: none;
    cursor: pointer;
    border-radius: var(--r-sm);
    transition: background 0.1s;
  }
  .emoji-picker__item:hover { background: var(--clr-surface2); }

  /* Title */
  .editor__title {
    font-size: 2.6rem;
    font-weight: 800;
    color: var(--clr-text-primary);
    line-height: 1.2;
    outline: none;
    cursor: text;
    width: 100%;
    word-break: break-word;
    margin-bottom: 6px;
    caret-color: var(--clr-accent);
  }
  .editor__title:empty::before {
    content: attr(data-placeholder);
    color: var(--clr-text-muted);
    opacity: 0.4;
    pointer-events: none;
  }

  /* Meta */
  .editor__meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: var(--clr-text-muted);
    padding-bottom: 28px;
    border-bottom: 1px solid var(--clr-border);
    margin-bottom: 20px;
  }

  /* Blocks */
  .editor__blocks {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-height: 200px;
  }

  /* Add block hint */
  .editor__add-block {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 16px;
    padding: 8px 4px;
    color: var(--clr-text-muted);
    font-size: 0.85rem;
    background: none;
    border: none;
    cursor: text;
    border-radius: var(--r-md);
    width: 100%;
    text-align: left;
    opacity: 0;
    transition: opacity 0.2s;
  }
  .editor__blocks:hover .editor__add-block { opacity: 0.5; }
  .editor__add-block:hover { opacity: 1 !important; background: var(--clr-surface); }

  .editor__add-block-icon {
    width: 22px;
    height: 22px;
    border: 1px solid var(--clr-border);
    border-radius: var(--r-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    flex-shrink: 0;
    color: var(--clr-text-muted);
  }

  kbd {
    font-family: monospace;
    font-size: 0.8em;
    padding: 1px 5px;
    border: 1px solid var(--clr-border);
    border-radius: 3px;
    background: var(--clr-surface);
    color: var(--clr-text-secondary);
  }
</style>
