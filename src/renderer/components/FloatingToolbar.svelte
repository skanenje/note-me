<script>
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  export let selection = null; // { x, y, width }

  const dispatch = createEventDispatcher();

  function execCmd(cmd, value = null) {
    document.execCommand(cmd, false, value);
    dispatch('format', { cmd });
  }

  function isActive(cmd) {
    try { return document.queryCommandState(cmd); } catch { return false; }
  }

  // Reactive formatStates - re-check on each render
  let bold = false, italic = false, underline = false, strikethrough = false, code = false;
  function updateStates() {
    bold = isActive('bold');
    italic = isActive('italic');
    underline = isActive('underline');
    strikethrough = isActive('strikeThrough');
  }

  $: if (selection) updateStates();
</script>

{#if selection}
  <div
    class="ft"
    style="left:{selection.x}px; top:{Math.max(8, selection.y - 48)}px"
  >
    <button class="ft__btn" class:ft__btn--active={bold}        title="Bold (Ctrl+B)"      on:click={() => execCmd('bold')}>        <b>B</b></button>
    <button class="ft__btn" class:ft__btn--active={italic}      title="Italic (Ctrl+I)"    on:click={() => execCmd('italic')}>      <i>I</i></button>
    <button class="ft__btn" class:ft__btn--active={underline}   title="Underline (Ctrl+U)" on:click={() => execCmd('underline')}>   <u>U</u></button>
    <button class="ft__btn" class:ft__btn--active={strikethrough} title="Strikethrough"    on:click={() => execCmd('strikeThrough')}><s>S</s></button>
    <div class="ft__sep"></div>
    <button class="ft__btn" title="Inline code" on:click={() => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount) {
        const range = sel.getRangeAt(0);
        const code = document.createElement('code');
        code.style.cssText = 'background:rgba(100,100,200,0.15);padding:1px 5px;border-radius:3px;font-family:monospace;font-size:0.88em;color:#93c5fd';
        range.surroundContents(code);
        sel.removeAllRanges();
      }
    }}><code style="font-size:0.75rem">code</code></button>
    <div class="ft__sep"></div>
    <button class="ft__btn" title="Link" on:click={() => {
      const url = prompt('Enter URL:');
      if (url) execCmd('createLink', url);
    }}>🔗</button>
    <button class="ft__btn ft__btn--danger" title="Clear formatting" on:click={() => execCmd('removeFormat')}>✕</button>
  </div>
{/if}

<style>
  .ft {
    position: fixed;
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 2px;
    background: var(--clr-surface);
    border: 1px solid var(--clr-border);
    border-radius: var(--r-md);
    padding: 4px 6px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    animation: ftIn 0.1s ease;
    pointer-events: all;
  }

  @keyframes ftIn {
    from { opacity: 0; transform: translateY(4px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .ft__btn {
    min-width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    border-radius: var(--r-sm);
    color: var(--clr-text-secondary);
    cursor: pointer;
    font-size: 0.8rem;
    padding: 0 5px;
    transition: background 0.1s, color 0.1s;
  }

  .ft__btn:hover { background: var(--clr-surface2); color: var(--clr-text-primary); }
  .ft__btn--active { background: var(--clr-accent-glow); color: var(--clr-accent); }
  .ft__btn--danger:hover { color: #f87171; }

  .ft__sep {
    width: 1px;
    height: 18px;
    background: var(--clr-border);
    margin: 0 2px;
  }
</style>
