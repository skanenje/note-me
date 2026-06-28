<script>
  import { createEventDispatcher } from 'svelte';

  export let blockId;
  export let code;
  export let language = 'javascript';

  const dispatch = createEventDispatcher();

  // ── Language metadata ────────────────────────────────────────────────────
  const LANG_META = {
    javascript: { label: 'JavaScript', icon: '🟨', color: '#f59e0b', alias: ['js'] },
    python:     { label: 'Python',     icon: '🐍', color: '#3b82f6', alias: ['python3','py'] },
    sql:        { label: 'SQL',        icon: '🗄️',  color: '#10b981', alias: ['sqlite'] },
    bash:       { label: 'Bash',       icon: '🐚', color: '#a78bfa', alias: ['sh','shell'] },
  };

  function resolveLang(l) {
    const key = (l || 'javascript').toLowerCase();
    for (const [k, v] of Object.entries(LANG_META)) {
      if (k === key || v.alias.includes(key)) return k;
    }
    return 'javascript';
  }

  $: lang    = resolveLang(language);
  $: meta    = LANG_META[lang] ?? LANG_META.javascript;

  // ── State ────────────────────────────────────────────────────────────────
  let editableCode = code;
  let output       = '';
  let isError      = false;
  let loading      = false;
  let isEditing    = false;
  let runCount     = 0;
  let elapsed      = 0;
  let _timer;

  // ── Execution ─────────────────────────────────────────────────────────────
  async function handleRun() {
    loading  = true;
    output   = '';
    isError  = false;
    elapsed  = 0;
    const t0 = Date.now();
    _timer   = setInterval(() => { elapsed = Date.now() - t0; }, 100);

    try {
      const result = await window.api.executeCode({
        code:     editableCode,
        language: lang,
        blockId,
      });

      clearInterval(_timer);
      elapsed = Date.now() - t0;

      if (result.success) {
        output  = result.output ?? '(no output)';
        isError = false;
        runCount++;
        dispatch('run');
      } else {
        output  = result.error ?? 'Unknown error';
        isError = true;
      }
    } catch (err) {
      clearInterval(_timer);
      output  = err.message;
      isError = true;
    } finally {
      loading = false;
    }
  }

  function handleReset() {
    editableCode = code;
    output       = '';
    isError      = false;
    isEditing    = false;
  }

  function handleKeydown(e) {
    // Ctrl+Enter / Cmd+Enter to run
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRun();
    }
    // Tab → insert 2 spaces (no focus-trap)
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta    = e.target;
      const start = ta.selectionStart;
      const end   = ta.selectionEnd;
      editableCode = editableCode.substring(0, start) + '  ' + editableCode.substring(end);
      // Restore cursor after Svelte re-render
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  }

  $: isDirty = editableCode !== code;
</script>

<div class="cb" style="--lang-color:{meta.color}">
  <!-- ── Header bar ──────────────────────────────────────────────────────── -->
  <div class="cb__bar">
    <div class="cb__lang">
      <span class="cb__lang-dot" style="background:{meta.color}"></span>
      <span class="cb__lang-label">{meta.label}</span>
    </div>

    <div class="cb__actions">
      {#if isDirty}
        <button class="cb__btn cb__btn--ghost" title="Reset to original" on:click={handleReset}>
          ↺ Reset
        </button>
      {/if}
      <button
        class="cb__btn cb__btn--edit"
        class:cb__btn--editing={isEditing}
        on:click={() => { isEditing = !isEditing; }}
        title="{isEditing ? 'Lock code' : 'Edit code'}"
      >
        {isEditing ? '🔒 Lock' : '✏️ Edit'}
      </button>
      <button
        class="cb__btn cb__btn--run"
        on:click={handleRun}
        disabled={loading}
        title="Run code (Ctrl+Enter)"
      >
        {#if loading}
          <span class="cb__spinner"></span>
          <span>{(elapsed / 1000).toFixed(1)}s</span>
        {:else}
          <span>▶</span>
          <span>Run</span>
        {/if}
      </button>
    </div>
  </div>

  <!-- ── Code area ─────────────────────────────────────────────────────────── -->
  {#if isEditing}
    <textarea
      class="cb__editor"
      bind:value={editableCode}
      on:keydown={handleKeydown}
      spellcheck="false"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
    ></textarea>
  {:else}
    <!-- Read-only display with line numbers -->
    <div class="cb__code-wrap">
      <div class="cb__line-nums" aria-hidden="true">
        {#each editableCode.split('\n') as _, i}
          <span>{i + 1}</span>
        {/each}
      </div>
      <pre class="cb__pre"><code>{editableCode}</code></pre>
    </div>
  {/if}

  <!-- ── Footer hint ────────────────────────────────────────────────────────── -->
  {#if isEditing}
    <div class="cb__hint">
      <span>Ctrl+Enter to run</span>
      <span>·</span>
      <span>Tab to indent</span>
      {#if isDirty}<span>· <em>modified</em></span>{/if}
    </div>
  {/if}

  <!-- ── Output panel ──────────────────────────────────────────────────────── -->
  {#if output || loading}
    <div class="cb__output" class:cb__output--error={isError}>
      <div class="cb__output-bar">
        <span class="cb__output-label">
          {#if isError}
            <span style="color:#f87171">✕ Error</span>
          {:else}
            <span style="color:#6ee7b7">✓ Output</span>
          {/if}
        </span>
        {#if elapsed && !loading}
          <span class="cb__output-elapsed">{(elapsed / 1000).toFixed(2)}s</span>
        {/if}
        {#if runCount > 0}
          <span class="cb__run-badge">Run #{runCount}</span>
        {/if}
        {#if output}
          <button
            class="cb__copy-btn"
            title="Copy output"
            on:click={() => navigator.clipboard.writeText(output)}
          >📋</button>
        {/if}
      </div>
      {#if loading}
        <div class="cb__output-loading">
          <div class="cb__dots">
            <span></span><span></span><span></span>
          </div>
          <span>Running {meta.label}…</span>
        </div>
      {:else}
        <pre class="cb__output-pre" class:cb__output-pre--error={isError}>{output}</pre>
      {/if}
    </div>
  {/if}
</div>

<style>
  .cb {
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid var(--clr-border);
    background: #0d1117;
    font-family: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace;
  }

  /* ── Header bar ─────────────────────────────────────────────────────────── */
  .cb__bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 14px;
    background: #161b22;
    border-bottom: 1px solid rgba(255,255,255,0.07);
  }

  .cb__lang {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .cb__lang-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
    box-shadow: 0 0 6px var(--lang-color);
  }

  .cb__lang-label {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--lang-color);
    font-family: inherit;
  }

  .cb__actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .cb__btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid transparent;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;
  }

  .cb__btn--ghost {
    background: transparent;
    border-color: rgba(255,255,255,0.12);
    color: rgba(148,163,184,0.8);
  }
  .cb__btn--ghost:hover { background: rgba(255,255,255,0.06); color: #f1f5f9; }

  .cb__btn--edit {
    background: rgba(255,255,255,0.05);
    border-color: rgba(255,255,255,0.1);
    color: rgba(148,163,184,0.8);
  }
  .cb__btn--edit:hover  { background: rgba(255,255,255,0.1); color: #f1f5f9; }
  .cb__btn--editing     { background: rgba(167,139,250,0.15); border-color: rgba(167,139,250,0.4); color: #a78bfa; }

  .cb__btn--run {
    background: linear-gradient(135deg, #16a34a, #15803d);
    border-color: transparent;
    color: white;
    box-shadow: 0 2px 8px rgba(22,163,74,0.3);
    min-width: 72px;
    justify-content: center;
  }
  .cb__btn--run:hover:not(:disabled) {
    background: linear-gradient(135deg, #15803d, #166534);
    box-shadow: 0 4px 12px rgba(22,163,74,0.45);
    transform: translateY(-1px);
  }
  .cb__btn--run:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

  .cb__spinner {
    width: 12px;
    height: 12px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
    display: inline-block;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Code display (read-only) ─────────────────────────────────────────── */
  .cb__code-wrap {
    display: flex;
    overflow-x: auto;
  }

  .cb__line-nums {
    display: flex;
    flex-direction: column;
    padding: 14px 10px 14px 14px;
    background: #0d1117;
    text-align: right;
    font-size: 0.78rem;
    line-height: 1.7;
    color: rgba(99,110,123,0.5);
    user-select: none;
    flex-shrink: 0;
    min-width: 36px;
  }

  .cb__pre {
    flex: 1;
    padding: 14px 16px;
    overflow-x: visible;
    margin: 0;
    background: #0d1117;
    font-size: 0.82rem;
    line-height: 1.7;
    color: #c9d1d9;
    white-space: pre;
    word-break: normal;
  }

  /* ── Editor textarea ──────────────────────────────────────────────────── */
  .cb__editor {
    width: 100%;
    min-height: 180px;
    padding: 14px 16px;
    background: #0d1117;
    color: #c9d1d9;
    font-family: inherit;
    font-size: 0.82rem;
    line-height: 1.7;
    border: none;
    outline: none;
    resize: vertical;
    box-sizing: border-box;
    border-top: 2px solid rgba(167,139,250,0.3);
    caret-color: #a78bfa;
  }
  .cb__editor:focus {
    border-top-color: rgba(167,139,250,0.7);
    background: #0f1520;
  }

  /* ── Hint bar ────────────────────────────────────────────────────────── */
  .cb__hint {
    display: flex;
    gap: 6px;
    padding: 5px 14px;
    background: #161b22;
    font-size: 0.68rem;
    color: rgba(99,110,123,0.7);
    border-top: 1px solid rgba(255,255,255,0.05);
  }
  .cb__hint em { color: #fbbf24; font-style: normal; }

  /* ── Output panel ────────────────────────────────────────────────────── */
  .cb__output {
    border-top: 1px solid rgba(255,255,255,0.07);
  }

  .cb__output-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    background: #161b22;
    font-size: 0.72rem;
  }
  .cb__output-label { font-weight: 700; }
  .cb__output-elapsed { color: rgba(148,163,184,0.5); margin-left: auto; }
  .cb__run-badge {
    padding: 1px 7px;
    border-radius: 10px;
    background: rgba(255,255,255,0.06);
    color: rgba(148,163,184,0.5);
    font-size: 0.65rem;
  }

  .cb__copy-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.8rem;
    opacity: 0.5;
    padding: 0 2px;
    transition: opacity 0.15s;
  }
  .cb__copy-btn:hover { opacity: 1; }

  .cb__output-pre {
    padding: 12px 16px;
    margin: 0;
    font-family: inherit;
    font-size: 0.8rem;
    line-height: 1.65;
    color: #6ee7b7;
    white-space: pre-wrap;
    word-break: break-word;
    background: #040c0a;
  }
  .cb__output-pre--error {
    color: #fca5a5;
    background: #150808;
  }

  .cb__output-loading {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    font-size: 0.82rem;
    color: rgba(148,163,184,0.6);
    background: #040c0a;
  }

  /* Animated dots */
  .cb__dots { display: flex; gap: 4px; }
  .cb__dots span {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: currentColor;
    animation: dot-bounce 1.2s infinite ease-in-out;
    opacity: 0.4;
  }
  .cb__dots span:nth-child(1) { animation-delay: 0s; }
  .cb__dots span:nth-child(2) { animation-delay: 0.2s; }
  .cb__dots span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes dot-bounce {
    0%, 80%, 100% { transform: scale(0.7); opacity: 0.3; }
    40%           { transform: scale(1);   opacity: 1; }
  }
</style>
