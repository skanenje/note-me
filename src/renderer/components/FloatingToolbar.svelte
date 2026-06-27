<script>
  import { createEventDispatcher } from 'svelte';
  export let selection = null; // { x, y }

  const dispatch = createEventDispatcher();

  // Link input state
  let showLinkInput = false;
  let linkUrl = '';
  let linkInputEl;

  function execCmd(cmd, value = null) {
    document.execCommand(cmd, false, value);
    dispatch('format', { cmd });
  }

  function isActive(cmd) {
    try { return document.queryCommandState(cmd); } catch { return false; }
  }

  let bold = false, italic = false, underline = false, strikethrough = false;
  function updateStates() {
    bold = isActive('bold');
    italic = isActive('italic');
    underline = isActive('underline');
    strikethrough = isActive('strikeThrough');
  }

  $: if (selection) { updateStates(); showLinkInput = false; linkUrl = ''; }

  // Save the selection range so we can restore it after the link input steals focus
  let savedRange = null;
  function openLinkInput() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount) savedRange = sel.getRangeAt(0).cloneRange();
    showLinkInput = true;
    setTimeout(() => linkInputEl?.focus(), 30);
  }

  function confirmLink() {
    const url = linkUrl.trim();
    if (!url) { cancelLink(); return; }
    // Restore selection then insert link
    if (savedRange) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedRange);
    }
    const href = url.startsWith('http') ? url : 'https://' + url;
    execCmd('createLink', href);
    cancelLink();
  }

  function cancelLink() {
    showLinkInput = false;
    linkUrl = '';
    savedRange = null;
  }

  function handleLinkKeydown(e) {
    if (e.key === 'Enter') { e.preventDefault(); confirmLink(); }
    else if (e.key === 'Escape') { e.preventDefault(); cancelLink(); }
  }
</script>

{#if selection}
  <div
    class="ft"
    style="left:{selection.x}px; top:{Math.max(8, selection.y - 48)}px"
  >
    {#if showLinkInput}
      <!-- Inline link URL input -->
      <div class="ft__link-row">
        <span class="ft__link-icon">🔗</span>
        <input
          bind:this={linkInputEl}
          bind:value={linkUrl}
          class="ft__link-input"
          placeholder="https://..."
          type="url"
          on:keydown={handleLinkKeydown}
        />
        <button class="ft__btn ft__btn--confirm" title="Apply (Enter)" on:click={confirmLink}>✓</button>
        <button class="ft__btn ft__btn--danger" title="Cancel (Esc)" on:click={cancelLink}>✕</button>
      </div>
    {:else}
      <button class="ft__btn" class:ft__btn--active={bold}         title="Bold (Ctrl+B)"       on:click={() => execCmd('bold')}>        <b>B</b></button>
      <button class="ft__btn" class:ft__btn--active={italic}       title="Italic (Ctrl+I)"     on:click={() => execCmd('italic')}>      <i>I</i></button>
      <button class="ft__btn" class:ft__btn--active={underline}    title="Underline (Ctrl+U)"  on:click={() => execCmd('underline')}>   <u>U</u></button>
      <button class="ft__btn" class:ft__btn--active={strikethrough} title="Strikethrough"      on:click={() => execCmd('strikeThrough')}><s>S</s></button>
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
      <button class="ft__btn" title="Insert link" on:click={openLinkInput}>🔗</button>
      <button class="ft__btn ft__btn--danger" title="Clear formatting" on:click={() => execCmd('removeFormat')}>✕</button>
    {/if}
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
  .ft__btn--confirm { color: #6ee7b7; }
  .ft__btn--confirm:hover { background: rgba(16,185,129,0.15); color: #10b981; }

  .ft__sep {
    width: 1px;
    height: 18px;
    background: var(--clr-border);
    margin: 0 2px;
  }

  /* Inline link input */
  .ft__link-row {
    display: flex;
    align-items: center;
    gap: 4px;
    animation: ftIn 0.1s ease;
  }

  .ft__link-icon { font-size: 0.9rem; opacity: 0.7; }

  .ft__link-input {
    width: 200px;
    height: 26px;
    background: var(--clr-bg);
    border: 1px solid var(--clr-accent);
    border-radius: var(--r-sm);
    padding: 0 8px;
    font-size: 0.78rem;
    color: var(--clr-text-primary);
    outline: none;
    font-family: inherit;
  }
</style>
