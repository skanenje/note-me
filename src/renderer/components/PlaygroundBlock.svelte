<script>
  import { createEventDispatcher } from 'svelte';

  export let blockId;
  export let initialContent;
  export let language = "javascript";

  const dispatch = createEventDispatcher();

  let input = initialContent || "";
  let output = "";
  let outputType = ""; // 'success' | 'error'
  let running = false;

  async function handleRun() {
    if (!input.trim()) return;
    running = true;
    output = "";
    outputType = "";

    // Simulate async (allows UI to update)
    await new Promise(r => setTimeout(r, 10));

    try {
      if (language === "javascript" || language === "js") {
        const logs = [];
        const sandbox = new Function(
          'console',
          `"use strict";\n${input}`
        );
        const fakeConsole = {
          log: (...args) => logs.push(args.map(String).join(' ')),
          error: (...args) => logs.push('[error] ' + args.map(String).join(' ')),
          warn: (...args) => logs.push('[warn] ' + args.map(String).join(' ')),
        };
        const result = sandbox(fakeConsole);
        const out = [
          ...logs,
          ...(result !== undefined ? [String(result)] : []),
        ].join('\n');
        output = out || '(no output)';
        outputType = 'success';
        dispatch('run', { blockId, success: true });
      } else {
        output = `Language "${language}" is not supported in the browser playground.`;
        outputType = 'error';
      }
    } catch (err) {
      output = err.message || String(err);
      outputType = 'error';
    } finally {
      running = false;
    }
  }

  function handleClear() {
    output = "";
    outputType = "";
  }
</script>

<div class="playground">
  <div class="playground__header">
    <div class="playground__title">
      <span class="playground__icon">🚀</span>
      Interactive Playground
    </div>
    <span class="playground__lang">{language}</span>
  </div>

  <div class="playground__body">
    <div class="playground__editor-wrap">
      <textarea
        bind:value={input}
        placeholder="// Write your code here and click Run..."
        rows="8"
        class="playground__editor"
        on:keydown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleRun();
          }
        }}
      ></textarea>
    </div>

    <div class="playground__controls">
      <button
        class="run-btn"
        on:click={handleRun}
        disabled={running || !input.trim()}
      >
        {#if running}
          <span class="run-btn__spinner"></span> Running…
        {:else}
          ▶ Run
        {/if}
      </button>
      {#if output}
        <button class="clear-btn" on:click={handleClear}>Clear</button>
      {/if}
      <span class="playground__hint">Ctrl+Enter to run</span>
    </div>

    {#if output}
      <div class="playground__output" class:playground__output--error={outputType === 'error'}>
        <div class="playground__output-header">
          {outputType === 'error' ? '✕ Error' : '✓ Output'}
        </div>
        <pre class="playground__output-content">{output}</pre>
      </div>
    {/if}
  </div>
</div>

<style>
  .playground {
    border-radius: var(--r-lg);
    overflow: hidden;
    border: 1px solid var(--clr-accent);
    box-shadow: 0 0 24px var(--clr-accent-glow);
    background: var(--clr-surface);
  }

  .playground__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 18px;
    background: linear-gradient(90deg, rgba(124,58,237,0.2), rgba(6,182,212,0.1));
    border-bottom: 1px solid var(--clr-border);
  }

  .playground__title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    font-size: 0.9rem;
    color: var(--clr-text-primary);
  }

  .playground__icon { font-size: 1rem; }

  .playground__lang {
    background: rgba(124, 58, 237, 0.2);
    border: 1px solid rgba(124, 58, 237, 0.4);
    border-radius: var(--r-full);
    padding: 2px 10px;
    font-size: 0.72rem;
    font-weight: 700;
    color: #c4b5fd;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .playground__body {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .playground__editor-wrap {
    border-radius: var(--r-md);
    overflow: hidden;
    border: 1px solid var(--clr-border);
  }

  .playground__editor {
    width: 100%;
    padding: 14px 16px;
    background: var(--clr-bg);
    border: none;
    color: #7dd3fc;
    font-family: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace;
    font-size: 0.875rem;
    line-height: 1.7;
    resize: vertical;
    min-height: 160px;
    outline: none;
    tab-size: 2;
  }

  .playground__controls {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .run-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 8px 20px;
    background: var(--grad-primary);
    color: white;
    border: none;
    border-radius: var(--r-md);
    font-size: 0.875rem;
    font-weight: 700;
    cursor: pointer;
    transition: all var(--t-fast);
    font-family: inherit;
  }

  .run-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px var(--clr-accent-glow);
  }

  .run-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .run-btn__spinner {
    width: 12px;
    height: 12px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .clear-btn {
    padding: 8px 14px;
    background: transparent;
    border: 1px solid var(--clr-border);
    border-radius: var(--r-md);
    color: var(--clr-text-secondary);
    font-size: 0.8rem;
    cursor: pointer;
    transition: all var(--t-fast);
    font-family: inherit;
  }

  .clear-btn:hover {
    background: var(--clr-surface2);
    color: var(--clr-text-primary);
  }

  .playground__hint {
    margin-left: auto;
    font-size: 0.72rem;
    color: var(--clr-text-muted);
  }

  /* Output */
  .playground__output {
    border-radius: var(--r-md);
    overflow: hidden;
    border: 1px solid rgba(16, 185, 129, 0.3);
    background: rgba(16, 185, 129, 0.05);
    animation: slideUp 200ms ease forwards;
  }

  .playground__output--error {
    border-color: rgba(239, 68, 68, 0.4);
    background: rgba(239, 68, 68, 0.05);
  }

  .playground__output-header {
    padding: 8px 14px;
    font-size: 0.72rem;
    font-weight: 700;
    background: rgba(16, 185, 129, 0.15);
    color: #6ee7b7;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .playground__output--error .playground__output-header {
    background: rgba(239, 68, 68, 0.15);
    color: #fca5a5;
  }

  .playground__output-content {
    padding: 14px 16px;
    font-family: 'Fira Code', monospace;
    font-size: 0.85rem;
    color: var(--clr-text-primary);
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.6;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
</style>
