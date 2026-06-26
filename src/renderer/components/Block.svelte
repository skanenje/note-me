<script>
  import { createEventDispatcher, onMount, tick } from 'svelte';
  import SlashMenu from './SlashMenu.svelte';

  export let block;
  export let isFocused = false;

  const dispatch = createEventDispatcher();

  let el;
  let isDragging = false;
  let showSlash = false;
  let slashX = 0, slashY = 0, slashQuery = '';

  // ── Block type style helpers ──────────────────────────────────────────────
  const TAG_MAP = {
    paragraph: 'p', heading1: 'h1', heading2: 'h2', heading3: 'h3',
    quote: 'blockquote', code: 'pre', bullet: 'li', numbered: 'li',
    todo: 'div', callout: 'div', divider: 'hr',
  };

  const PLACEHOLDER_MAP = {
    paragraph: "Type '/' for commands…",
    heading1: 'Heading 1',
    heading2: 'Heading 2',
    heading3: 'Heading 3',
    quote: 'Empty quote…',
    code: '// Code…',
    bullet: 'List item',
    numbered: 'List item',
    todo: 'To-do item',
    callout: 'Callout text…',
    divider: '',
  };

  // Sync DOM → block content (debounced save)
  let saveTimer;
  function scheduleSync() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => syncContent(), 600);
  }

  function syncContent() {
    if (!el || block.type === 'divider') return;
    const raw = el.innerHTML;
    if (raw !== block.content) {
      dispatch('update', { blockId: block.id, content: raw });
    }
  }

  // ── Keyboard handler ──────────────────────────────────────────────────────
  function handleKeydown(e) {
    // Slash menu trigger
    if (e.key === '/' && !showSlash) {
      const sel = window.getSelection();
      if (sel && el?.textContent?.trim() === '') {
        e.preventDefault();
        const rect = el.getBoundingClientRect();
        slashX = rect.left;
        slashY = rect.bottom + window.scrollY;
        slashQuery = '';
        showSlash = true;
        return;
      }
    }

    if (showSlash) {
      if (e.key === 'Backspace') {
        if (slashQuery.length > 0) { slashQuery = slashQuery.slice(0, -1); }
        else { showSlash = false; }
        return;
      }
      if (e.key.length === 1 && e.key !== '/') {
        slashQuery += e.key;
        return;
      }
    }

    // Enter: create new block after this one
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      syncContent();
      const newType = ['heading1','heading2','heading3','divider','code'].includes(block.type) ? 'paragraph' : block.type;
      dispatch('createAfter', { blockId: block.id, type: newType });
      return;
    }

    // Backspace on empty: delete block
    if (e.key === 'Backspace') {
      const text = el?.innerText?.trim();
      if (!text || text === '') {
        e.preventDefault();
        dispatch('delete', { blockId: block.id });
        return;
      }
    }

    // Tab: indent
    if (e.key === 'Tab') {
      e.preventDefault();
      const newIndent = e.shiftKey ? Math.max(0, (block.indent || 0) - 1) : Math.min(8, (block.indent || 0) + 1);
      dispatch('indent', { blockId: block.id, indent: newIndent });
      return;
    }

    // Markdown shortcuts (at line start)
    checkMarkdownShortcut(e);
  }

  function handleInput(e) {
    scheduleSync();
  }

  // Markdown auto-conversion
  function checkMarkdownShortcut(e) {
    if (!el) return;
    const text = el.innerText || '';
    const conversions = [
      { pattern: /^# $/, type: 'heading1' },
      { pattern: /^## $/, type: 'heading2' },
      { pattern: /^### $/, type: 'heading3' },
      { pattern: /^- $/, type: 'bullet' },
      { pattern: /^\* $/, type: 'bullet' },
      { pattern: /^1\. $/, type: 'numbered' },
      { pattern: /^\[\] $/, type: 'todo' },
      { pattern: /^> $/, type: 'quote' },
      { pattern: /^``` $/, type: 'code' },
      { pattern: /^--- $/, type: 'divider' },
    ];

    for (const { pattern, type } of conversions) {
      if (pattern.test(text) && e.key === ' ') {
        e.preventDefault();
        el.innerHTML = '';
        dispatch('changeType', { blockId: block.id, type });
        return;
      }
    }
  }

  function handleSlashSelect(e) {
    showSlash = false;
    if (el) el.innerHTML = '';
    dispatch('changeType', { blockId: block.id, type: e.detail.type });
  }

  // ── Drag & Drop ───────────────────────────────────────────────────────────
  function dragStart(e) {
    e.dataTransfer.setData('blockId', block.id);
    e.dataTransfer.setData('position', String(block.position));
    isDragging = true;
  }

  function dragEnd() { isDragging = false; }

  function dragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('block--dragover');
  }

  function dragLeave(e) {
    e.currentTarget.classList.remove('block--dragover');
  }

  function drop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('block--dragover');
    const fromId = e.dataTransfer.getData('blockId');
    if (fromId !== block.id) {
      dispatch('move', { fromId, toPosition: block.position });
    }
  }

  // ── Initialize content ────────────────────────────────────────────────────
  onMount(async () => {
    if (el && block.type !== 'divider') {
      el.innerHTML = block.content || '';
    }
    if (isFocused && el) {
      await tick();
      el.focus();
      // Move cursor to end
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(el);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  });

  // Re-sync when block content changes externally
  $: if (el && block.content !== undefined && document.activeElement !== el) {
    el.innerHTML = block.content || '';
  }

  $: blockClass = [
    'block',
    `block--${block.type}`,
    isDragging ? 'block--dragging' : '',
  ].filter(Boolean).join(' ');
</script>

<div
  class={blockClass}
  style="padding-left: {(block.indent || 0) * 24 + 8}px"
  draggable={block.type !== 'divider'}
  on:dragstart={dragStart}
  on:dragend={dragEnd}
  on:dragover={dragOver}
  on:dragleave={dragLeave}
  on:drop={drop}
  role="listitem"
>
  <!-- Drag handle -->
  <div class="block__handle" title="Drag to reorder">⠿</div>

  <!-- Block actions menu -->
  <div class="block__actions">
    <button class="block__action-btn" title="Delete block" on:click={() => dispatch('delete', { blockId: block.id })}>🗑</button>
    <button class="block__action-btn" title="Duplicate block" on:click={() => dispatch('duplicate', { blockId: block.id })}>⧉</button>
  </div>

  <!-- Render block body -->
  <div class="block__body">
    {#if block.type === 'divider'}
      <hr class="block__divider" />

    {:else if block.type === 'todo'}
      <div class="block__todo-wrap">
        <input
          type="checkbox"
          class="block__todo-cb"
          checked={block.metadata?.checked || false}
          on:change={(e) => dispatch('update', {
            blockId: block.id,
            content: block.content,
            metadata: { ...block.metadata, checked: e.target.checked }
          })}
        />
        <div
          bind:this={el}
          contenteditable="true"
          class="block__editable block__todo-text"
          class:block__todo-text--done={block.metadata?.checked}
          data-placeholder={PLACEHOLDER_MAP.todo}
          on:keydown={handleKeydown}
          on:input={handleInput}
          on:blur={syncContent}
          on:focus={() => dispatch('focus', { blockId: block.id })}
          spellcheck="true"
          role="textbox"
          aria-multiline="true"
        ></div>
      </div>

    {:else if block.type === 'callout'}
      <div class="block__callout">
        <span class="block__callout-icon">{block.metadata?.icon || '💡'}</span>
        <div
          bind:this={el}
          contenteditable="true"
          class="block__editable"
          data-placeholder={PLACEHOLDER_MAP.callout}
          on:keydown={handleKeydown}
          on:input={handleInput}
          on:blur={syncContent}
          on:focus={() => dispatch('focus', { blockId: block.id })}
          spellcheck="true"
          role="textbox"
          aria-multiline="true"
        ></div>
      </div>

    {:else if block.type === 'bullet'}
      <div class="block__bullet-wrap">
        <span class="block__bullet-dot">•</span>
        <div
          bind:this={el}
          contenteditable="true"
          class="block__editable"
          data-placeholder={PLACEHOLDER_MAP.bullet}
          on:keydown={handleKeydown}
          on:input={handleInput}
          on:blur={syncContent}
          on:focus={() => dispatch('focus', { blockId: block.id })}
          spellcheck="true"
          role="textbox"
          aria-multiline="true"
        ></div>
      </div>

    {:else if block.type === 'numbered'}
      <div class="block__bullet-wrap">
        <span class="block__number-dot">{block.position + 1}.</span>
        <div
          bind:this={el}
          contenteditable="true"
          class="block__editable"
          data-placeholder={PLACEHOLDER_MAP.numbered}
          on:keydown={handleKeydown}
          on:input={handleInput}
          on:blur={syncContent}
          on:focus={() => dispatch('focus', { blockId: block.id })}
          spellcheck="true"
          role="textbox"
          aria-multiline="true"
        ></div>
      </div>

    {:else}
      <!-- paragraph, heading1-3, quote, code -->
      <div
        bind:this={el}
        contenteditable={block.type === 'code' ? 'plaintext-only' : 'true'}
        class="block__editable block--type-{block.type}"
        data-placeholder={PLACEHOLDER_MAP[block.type] || ''}
        on:keydown={handleKeydown}
        on:input={handleInput}
        on:blur={syncContent}
        on:focus={() => dispatch('focus', { blockId: block.id })}
        spellcheck={block.type !== 'code'}
        role="textbox"
        aria-multiline="true"
      ></div>
    {/if}
  </div>
</div>

{#if showSlash}
  <SlashMenu x={slashX} y={slashY} query={slashQuery}
    on:select={handleSlashSelect}
    on:close={() => showSlash = false}
  />
{/if}

<style>
  .block {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 4px;
    min-height: 28px;
    border-radius: var(--r-sm);
    transition: background 0.1s;
    padding-top: 2px;
    padding-bottom: 2px;
    group: true;
  }

  .block:hover { background: rgba(255,255,255,0.03); }
  .block--dragover { background: rgba(139,92,246,0.08); border: 1px dashed var(--clr-accent); border-radius: var(--r-md); }
  .block--dragging { opacity: 0.4; }

  /* Drag handle */
  .block__handle {
    flex-shrink: 0;
    width: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    color: var(--clr-text-muted);
    opacity: 0;
    cursor: grab;
    padding-top: 4px;
    transition: opacity 0.1s;
    user-select: none;
  }
  .block:hover .block__handle { opacity: 0.5; }
  .block__handle:hover { opacity: 1 !important; }

  /* Block actions */
  .block__actions {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    opacity: 0;
    transition: opacity 0.1s;
    padding-top: 2px;
  }
  .block:hover .block__actions { opacity: 1; }

  .block__action-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.7rem;
    padding: 2px;
    border-radius: 3px;
    color: var(--clr-text-muted);
    transition: background 0.1s, color 0.1s;
    line-height: 1;
  }
  .block__action-btn:hover { background: var(--clr-surface2); color: var(--clr-text-primary); }

  /* Block body */
  .block__body { flex: 1; min-width: 0; }

  /* Contenteditable base */
  .block__editable {
    outline: none;
    width: 100%;
    min-height: 1.6em;
    color: var(--clr-text-primary);
    line-height: 1.7;
    font-size: 0.95rem;
    word-break: break-word;
    caret-color: var(--clr-accent);
    cursor: text;
  }

  .block__editable:empty::before {
    content: attr(data-placeholder);
    color: var(--clr-text-muted);
    pointer-events: none;
    opacity: 0.5;
  }

  /* Type-specific styles */
  :global(.block--type-heading1) { font-size: 2rem; font-weight: 800; color: var(--clr-text-primary); line-height: 1.3; }
  :global(.block--type-heading2) { font-size: 1.5rem; font-weight: 700; color: var(--clr-text-primary); line-height: 1.35; }
  :global(.block--type-heading3) { font-size: 1.2rem; font-weight: 600; color: var(--clr-text-primary); line-height: 1.4; }
  :global(.block--type-quote) {
    border-left: 3px solid var(--clr-accent);
    padding-left: 14px;
    color: var(--clr-text-secondary);
    font-style: italic;
    font-size: 1rem;
  }
  :global(.block--type-code) {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 0.875rem;
    background: var(--clr-bg);
    border: 1px solid var(--clr-border);
    border-radius: var(--r-md);
    padding: 12px 16px;
    color: #7dd3fc;
    white-space: pre;
    overflow-x: auto;
  }

  /* Divider */
  .block__divider {
    border: none;
    border-top: 1px solid var(--clr-border);
    margin: 8px 0;
    width: 100%;
  }

  /* Todo */
  .block__todo-wrap {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }
  .block__todo-cb {
    margin-top: 5px;
    width: 16px;
    height: 16px;
    accent-color: var(--clr-accent);
    cursor: pointer;
    flex-shrink: 0;
  }
  .block__todo-text--done { text-decoration: line-through; opacity: 0.5; }

  /* Bullet/Numbered */
  .block__bullet-wrap {
    display: flex;
    align-items: flex-start;
    gap: 6px;
  }
  .block__bullet-dot {
    flex-shrink: 0;
    color: var(--clr-text-secondary);
    font-size: 1rem;
    margin-top: 2px;
    user-select: none;
  }
  .block__number-dot {
    flex-shrink: 0;
    color: var(--clr-text-secondary);
    font-size: 0.9rem;
    margin-top: 3px;
    min-width: 24px;
    user-select: none;
  }

  /* Callout */
  .block__callout {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: rgba(139,92,246,0.08);
    border: 1px solid rgba(139,92,246,0.2);
    border-radius: var(--r-md);
    padding: 12px 14px;
  }
  .block__callout-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 2px; }
</style>
