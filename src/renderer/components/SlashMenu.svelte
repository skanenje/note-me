<script>
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  export let x = 0;
  export let y = 0;
  export let query = '';

  const dispatch = createEventDispatcher();

  const BLOCK_TYPES = [
    { type: 'paragraph',  icon: '¶',   label: 'Paragraph',     desc: 'Just start writing',       keywords: ['p', 'text', 'paragraph'] },
    { type: 'heading1',   icon: 'H1',  label: 'Heading 1',     desc: 'Big section heading',       keywords: ['h1', 'heading', 'title'] },
    { type: 'heading2',   icon: 'H2',  label: 'Heading 2',     desc: 'Medium section heading',    keywords: ['h2', 'heading'] },
    { type: 'heading3',   icon: 'H3',  label: 'Heading 3',     desc: 'Small section heading',     keywords: ['h3', 'heading'] },
    { type: 'bullet',     icon: '•',   label: 'Bullet List',   desc: 'Simple bullet list',        keywords: ['ul', 'bullet', 'list', '-'] },
    { type: 'numbered',   icon: '1.',  label: 'Numbered List', desc: 'Ordered numbered list',     keywords: ['ol', 'numbered', 'ordered', 'list'] },
    { type: 'todo',       icon: '☐',   label: 'To-Do',         desc: 'Track tasks with checkboxes', keywords: ['todo', 'task', 'check', '[]'] },
    { type: 'quote',      icon: '❝',   label: 'Quote',         desc: 'Capture a quote or idea',   keywords: ['quote', 'blockquote', '>'] },
    { type: 'code',       icon: '</>',  label: 'Code Block',    desc: 'Syntax highlighted code',   keywords: ['code', 'pre', '```'] },
    { type: 'callout',   icon: '💡',   label: 'Callout',       desc: 'Highlighted info box',      keywords: ['callout', 'info', 'tip', 'note'] },
    { type: 'divider',    icon: '—',   label: 'Divider',       desc: 'Visual section separator',  keywords: ['hr', 'divider', 'line', '---'] },
  ];

  $: filtered = BLOCK_TYPES.filter(b =>
    !query || b.keywords.some(k => k.startsWith(query.toLowerCase())) ||
    b.label.toLowerCase().includes(query.toLowerCase())
  );

  let selected = 0;
  $: if (filtered.length > 0) selected = Math.min(selected, filtered.length - 1);

  function pick(type) {
    dispatch('select', { type });
  }

  function handleKeydown(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); selected = (selected + 1) % filtered.length; }
    else if (e.key === 'ArrowUp') { e.preventDefault(); selected = (selected - 1 + filtered.length) % filtered.length; }
    else if (e.key === 'Enter' && filtered[selected]) { e.preventDefault(); pick(filtered[selected].type); }
    else if (e.key === 'Escape') { e.preventDefault(); dispatch('close'); }
  }

  onMount(() => window.addEventListener('keydown', handleKeydown));
  onDestroy(() => window.removeEventListener('keydown', handleKeydown));
</script>

<div class="slash-menu" style="left:{x}px; top:{y}px">
  <div class="slash-menu__header">Block Type</div>
  {#if filtered.length === 0}
    <div class="slash-menu__empty">No results for "/{query}"</div>
  {:else}
    {#each filtered as item, i}
      <button
        class="slash-menu__item"
        class:slash-menu__item--selected={i === selected}
        on:click={() => pick(item.type)}
        on:mouseover={() => selected = i}
        on:focus={() => selected = i}
      >
        <span class="slash-menu__icon">{item.icon}</span>
        <span class="slash-menu__text">
          <span class="slash-menu__label">{item.label}</span>
          <span class="slash-menu__desc">{item.desc}</span>
        </span>
      </button>
    {/each}
  {/if}
</div>

<style>
  .slash-menu {
    position: fixed;
    z-index: 9999;
    width: 280px;
    background: var(--clr-surface);
    border: 1px solid var(--clr-border);
    border-radius: var(--r-lg);
    box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3);
    padding: 6px;
    overflow: hidden;
    animation: slashIn 0.12s cubic-bezier(0.16,1,0.3,1);
  }

  @keyframes slashIn {
    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .slash-menu__header {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--clr-text-muted);
    padding: 4px 10px 6px;
  }

  .slash-menu__empty {
    padding: 12px 10px;
    font-size: 0.85rem;
    color: var(--clr-text-muted);
    text-align: center;
  }

  .slash-menu__item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 8px 10px;
    border-radius: var(--r-md);
    cursor: pointer;
    background: transparent;
    border: none;
    text-align: left;
    transition: background 0.1s;
  }

  .slash-menu__item--selected {
    background: var(--clr-surface2);
  }

  .slash-menu__icon {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--clr-bg);
    border: 1px solid var(--clr-border);
    border-radius: var(--r-sm);
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--clr-text-secondary);
    font-family: monospace;
  }

  .slash-menu__text {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .slash-menu__label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--clr-text-primary);
  }

  .slash-menu__desc {
    font-size: 0.72rem;
    color: var(--clr-text-muted);
  }
</style>
