  import Prism from 'prismjs';
  import 'prismjs/themes/prism-tomorrow.css'; // dark theme
  import 'prismjs/components/prism-javascript';
  import 'prismjs/components/prism-css';
  import 'prismjs/components/prism-json';
  import 'prismjs/components/prism-bash';
  import 'prismjs/components/prism-markdown';

  export let block;
  export let onDelete;
  export let onUpdate;

  let editing = false;
  let editContent = block.content;
  let textareaEl;

  $: wordCount = block.content.split(/\s+/).filter(Boolean).length;
  $: highlightedCode = block.type === 'code' ? Prism.highlight(block.content, Prism.languages.javascript, 'javascript') : '';

  const BLOCK_ICONS = {
    paragraph: '¶',
    heading:   'H',
    list:      '≡',
    code:      '</>',
  };

  function startEdit() {
    editing = true;
    editContent = block.content;
    setTimeout(() => textareaEl?.focus(), 30);
  }

  async function saveEdit() {
    editing = false;
    if (editContent.trim() === block.content) return;
    await onUpdate?.(block.id, editContent.trim());
  }

  function cancelEdit() {
    editing = false;
    editContent = block.content;
  }
</script>

<div class="block" class:block--editing={editing}>
  <div class="block__gutter">
    <span class="block__type-badge">{BLOCK_ICONS[block.type] ?? '•'}</span>
    <span class="block__word-count">{wordCount}w</span>
  </div>

  <div class="block__body">
    {#if editing}
      <textarea
        bind:this={textareaEl}
        bind:value={editContent}
        class="block__editor"
        rows="4"
        on:keydown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveEdit();
          if (e.key === 'Escape') cancelEdit();
        }}
        on:blur={saveEdit}
      ></textarea>
      <div class="block__edit-hint">Ctrl+Enter to save · Esc to cancel</div>
    {:else}
      {#if block.type === 'heading'}
        <h3 class="block__heading" on:dblclick={startEdit}>{block.content}</h3>
      {:else if block.type === 'list'}
        <ul class="block__list" on:dblclick={startEdit}>
          {#each block.content.split('\n').filter(Boolean) as item}
            <li>{item.replace(/^[-*•]\s*/, '')}</li>
          {/each}
        </ul>
      {:else if block.type === 'code'}
        <pre class="block__code language-javascript" on:dblclick={startEdit}><code class="language-javascript">{@html highlightedCode || block.content}</code></pre>
      {:else}
        <p class="block__paragraph" on:dblclick={startEdit}>{block.content}</p>
      {/if}
    {/if}
  </div>

  <!-- Hover toolbar -->
  <div class="block__toolbar">
    <button class="block__toolbar-btn" title="Edit block" on:click={startEdit}>✏️</button>
    <button class="block__toolbar-btn block__toolbar-btn--danger" title="Delete block" on:click={() => onDelete(block.id)}>🗑</button>
  </div>
</div>

<style>
  .block {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 16px;
    border-radius: var(--r-lg);
    border: 1px solid transparent;
    background: var(--clr-surface);
    transition: all var(--t-fast);
    group: true;
  }

  .block:hover {
    border-color: var(--clr-border);
    background: var(--clr-surface2);
  }

  .block--editing {
    border-color: var(--clr-accent);
    background: var(--clr-surface2);
    box-shadow: 0 0 0 3px var(--clr-accent-glow);
  }

  .block__gutter {
    flex-shrink: 0;
    padding-top: 2px;
  }

  .block__type-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: var(--r-sm);
    background: var(--clr-surface2);
    border: 1px solid var(--clr-border);
    font-size: 0.6rem;
    font-weight: 700;
    color: var(--clr-text-muted);
    font-family: monospace;
    margin-bottom: 4px;
  }

  .block__word-count {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    font-size: 0.55rem;
    color: var(--clr-text-muted);
    opacity: 0.5;
  }

  .block__body {
    flex: 1;
    min-width: 0;
  }

  .block__paragraph {
    color: var(--clr-text-primary);
    line-height: 1.7;
    font-size: 0.95rem;
    cursor: text;
  }

  .block__heading {
    color: var(--clr-text-primary);
    font-size: 1.25rem;
    font-weight: 700;
    line-height: 1.3;
    cursor: text;
  }

  .block__list {
    color: var(--clr-text-primary);
    font-size: 0.95rem;
    padding-left: 20px;
    line-height: 1.8;
    cursor: text;
  }

  .block__code {
    background: var(--clr-bg);
    border: 1px solid var(--clr-border);
    border-radius: var(--r-md);
    padding: 12px 16px;
    font-family: 'Fira Code', 'Cascadia Code', monospace;
    font-size: 0.85rem;
    overflow-x: auto;
    cursor: text;
    line-height: 1.6;
    margin: 0;
  }

  .block__editor {
    width: 100%;
    padding: 8px;
    background: var(--clr-bg);
    border: 1px solid var(--clr-border);
    border-radius: var(--r-sm);
    color: var(--clr-text-primary);
    font-size: 0.9rem;
    font-family: inherit;
    line-height: 1.6;
    resize: vertical;
    outline: none;
  }

  .block__edit-hint {
    font-size: 0.7rem;
    color: var(--clr-text-muted);
    margin-top: 4px;
  }

  /* Hover toolbar */
  .block__toolbar {
    display: flex;
    flex-direction: column;
    gap: 4px;
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--t-fast);
    flex-shrink: 0;
  }

  .block:hover .block__toolbar {
    opacity: 1;
    pointer-events: all;
  }

  .block__toolbar-btn {
    background: var(--clr-surface2);
    border: 1px solid var(--clr-border);
    border-radius: var(--r-sm);
    padding: 4px 6px;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all var(--t-fast);
    line-height: 1;
  }

  .block__toolbar-btn:hover {
    background: var(--clr-surface);
    border-color: var(--clr-accent);
    transform: scale(1.1);
  }

  .block__toolbar-btn--danger:hover {
    background: rgba(239,68,68,0.15);
    border-color: rgba(239,68,68,0.5);
  }
</style>
