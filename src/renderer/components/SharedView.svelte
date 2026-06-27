<script>
  import { onMount } from 'svelte';
  import { documents } from '../stores/documents.js';
  import { toast } from '../stores/toast.js';

  // ── State ─────────────────────────────────────────────────────────────────
  let selectedDocId = '';
  let selectedFormat = 'markdown'; // 'markdown' | 'text'
  let previewContent = '';
  let loadingPreview = false;
  let exporting = false;
  let exportHistory = [];

  const FORMAT_OPTS = [
    { id: 'markdown', label: 'Markdown', icon: '📝', ext: 'md'  },
    { id: 'text',     label: 'Plain Text', icon: '📄', ext: 'txt' },
    { id: 'html',     label: 'HTML',       icon: '🌐', ext: 'html' },
  ];

  // ── Load export history from localStorage ─────────────────────────────────
  function loadHistory() {
    try {
      const raw = localStorage.getItem('note-me-export-history');
      exportHistory = raw ? JSON.parse(raw) : [];
    } catch { exportHistory = []; }
  }

  function saveHistory(entry) {
    exportHistory = [entry, ...exportHistory].slice(0, 20);
    localStorage.setItem('note-me-export-history', JSON.stringify(exportHistory));
  }

  function clearHistory() {
    exportHistory = [];
    localStorage.removeItem('note-me-export-history');
    toast.info('Export history cleared');
  }

  // ── HTML → text / markdown helpers ───────────────────────────────────────
  function stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html || '';
    return div.textContent || div.innerText || '';
  }

  function htmlToMarkdown(html) {
    if (!html) return '';
    return html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi,  '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi,  '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi,  '### $1\n\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi,         '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi,   '_$1_')
      .replace(/<i[^>]*>(.*?)<\/i>/gi,     '_$1_')
      .replace(/<u[^>]*>(.*?)<\/u>/gi,     '$1')
      .replace(/<s[^>]*>(.*?)<\/s>/gi,     '~~$1~~')
      .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<br\s*\/?>/gi,  '\n')
      .replace(/<\/p>/gi,       '\n\n')
      .replace(/<\/div>/gi,     '\n')
      .replace(/<[^>]+>/g,      '')
      .replace(/\n{3,}/g,       '\n\n')
      .trim();
  }

  function blocksToHtml(blocks, title) {
    if (!blocks || !blocks.length) return `<h1>${title || 'Untitled'}</h1>`;
    const body = blocks.map(b => {
      if (b.type === 'heading') return `<h2>${b.content}</h2>`;
      if (b.type === 'code')    return `<pre><code>${b.content}</code></pre>`;
      return `<p>${b.content || ''}</p>`;
    }).join('\n');
    return `<h1>${title || 'Untitled'}</h1>\n${body}`;
  }

  function buildOutput(doc, format) {
    const html = blocksToHtml(doc.blocks, doc.title);
    if (format === 'html')     return html;
    if (format === 'markdown') return `# ${doc.title || 'Untitled'}\n\n` + htmlToMarkdown(html.replace(/<h1[^>]*>.*?<\/h1>/i, '').trim());
    return `${doc.title || 'Untitled'}\n${'='.repeat((doc.title || 'Untitled').length)}\n\n` + stripHtml(html);
  }

  // ── Load preview when doc or format changes ───────────────────────────────
  async function loadPreview() {
    if (!selectedDocId) { previewContent = ''; return; }
    loadingPreview = true;
    try {
      const res = await window.api.getDocumentWithBlocks(selectedDocId);
      if (res.success) {
        previewContent = buildOutput(res.document, selectedFormat);
      } else {
        previewContent = '(Could not load document)';
      }
    } catch (e) {
      previewContent = '(Error: ' + e.message + ')';
    } finally {
      loadingPreview = false;
    }
  }

  $: if (selectedDocId || selectedFormat) loadPreview();

  // ── Download ──────────────────────────────────────────────────────────────
  async function handleDownload() {
    if (!selectedDocId || !previewContent) {
      toast.error('Select a note first');
      return;
    }
    exporting = true;
    try {
      const fmt  = FORMAT_OPTS.find(f => f.id === selectedFormat);
      const doc  = $documents.find(d => d.id === selectedDocId);
      const name = `${(doc?.title || 'note').replace(/[^a-z0-9_\-]/gi, '_')}.${fmt.ext}`;
      const mime = selectedFormat === 'html' ? 'text/html' : 'text/plain';

      const blob   = new Blob([previewContent], { type: mime });
      const url    = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href     = url;
      anchor.download = name;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      saveHistory({
        docTitle: doc?.title || 'Untitled',
        format: fmt.label,
        filename: name,
        exportedAt: new Date().toISOString(),
      });

      toast.success(`Exported as "${name}" ✓`);
    } catch (e) {
      toast.error('Export failed: ' + e.message);
    } finally {
      exporting = false;
    }
  }

  // ── Copy to clipboard ─────────────────────────────────────────────────────
  async function handleCopy() {
    if (!previewContent) { toast.error('Select a note first'); return; }
    try {
      await navigator.clipboard.writeText(previewContent);
      toast.success('Copied to clipboard ✓');
    } catch { toast.error('Clipboard access denied'); }
  }

  // ── Share snippet (formatted code block) ─────────────────────────────────
  let showSnippet = false;
  function toggleSnippet() { showSnippet = !showSnippet; }

  onMount(loadHistory);

  $: selectedDoc = $documents?.find(d => d.id === selectedDocId);
  $: wordCount   = previewContent ? previewContent.trim().split(/\s+/).filter(Boolean).length : 0;
  $: charCount   = previewContent.length;
</script>

<div class="sh">
  <!-- ── Header ──────────────────────────────────────────────────────────────── -->
  <div class="sh__hero">
    <div class="sh__hero-bg"></div>
    <div class="sh__hero-inner">
      <div>
        <h1 class="sh__hero-title">Export & Share</h1>
        <p class="sh__hero-sub">Download your notes in any format, or copy a snippet to share anywhere.</p>
      </div>
      <div class="sh__hero-formats">
        {#each FORMAT_OPTS as fmt}
          <button
            class="sh__fmt-badge"
            class:sh__fmt-badge--active={selectedFormat === fmt.id}
            on:click={() => selectedFormat = fmt.id}
          >
            {fmt.icon} {fmt.label}
          </button>
        {/each}
      </div>
    </div>
  </div>

  <div class="sh__body">
    <!-- ── Left panel: picker + actions ──────────────────────────────────────── -->
    <div class="sh__panel sh__panel--left">
      <!-- Note selector -->
      <div class="sh__field">
        <label class="sh__label">Select a Note</label>
        <div class="sh__select-wrap">
          <select class="sh__select" bind:value={selectedDocId}>
            <option value="">— Choose a note —</option>
            {#each ($documents || []) as doc}
              <option value={doc.id}>{doc.icon || '📄'} {doc.title || 'Untitled'}</option>
            {/each}
          </select>
        </div>
      </div>

      <!-- Format switcher -->
      <div class="sh__field">
        <label class="sh__label">Output Format</label>
        <div class="sh__format-cards">
          {#each FORMAT_OPTS as fmt}
            <button
              class="sh__fmt-card"
              class:sh__fmt-card--active={selectedFormat === fmt.id}
              on:click={() => selectedFormat = fmt.id}
            >
              <span class="sh__fmt-card-icon">{fmt.icon}</span>
              <span class="sh__fmt-card-name">{fmt.label}</span>
              <span class="sh__fmt-card-ext">.{fmt.ext}</span>
            </button>
          {/each}
        </div>
      </div>

      <!-- Stats -->
      {#if previewContent}
        <div class="sh__meta">
          <span>📊 {wordCount.toLocaleString()} words</span>
          <span>·</span>
          <span>{charCount.toLocaleString()} chars</span>
        </div>
      {/if}

      <!-- Actions -->
      <div class="sh__actions">
        <button
          class="sh__btn sh__btn--primary"
          on:click={handleDownload}
          disabled={!selectedDocId || exporting}
        >
          {#if exporting}
            <span class="sh__spinner"></span>Exporting…
          {:else}
            ⬇ Download {FORMAT_OPTS.find(f=>f.id===selectedFormat)?.ext.toUpperCase()}
          {/if}
        </button>

        <button
          class="sh__btn"
          on:click={handleCopy}
          disabled={!selectedDocId}
        >
          📋 Copy to Clipboard
        </button>

        <button
          class="sh__btn sh__btn--ghost"
          on:click={toggleSnippet}
          disabled={!selectedDocId}
        >
          {showSnippet ? '✕ Hide' : '〈/〉 View Snippet'}
        </button>
      </div>
    </div>

    <!-- ── Right panel: preview ───────────────────────────────────────────────── -->
    <div class="sh__panel sh__panel--right">
      <div class="sh__preview-header">
        <span class="sh__preview-label">
          {selectedDoc ? `${selectedDoc.icon || '📄'} ${selectedDoc.title || 'Untitled'}` : 'Preview'}
        </span>
        <span class="sh__preview-format">
          {FORMAT_OPTS.find(f => f.id === selectedFormat)?.label ?? ''}
        </span>
      </div>

      {#if !selectedDocId}
        <div class="sh__preview-empty">
          <span>📂</span>
          <p>Select a note to preview its export</p>
        </div>

      {:else if loadingPreview}
        <div class="sh__preview-loading">
          <div class="sh__spinner sh__spinner--lg"></div>
          <span>Generating preview…</span>
        </div>

      {:else if showSnippet}
        <!-- Snippet view -->
        <div class="sh__snippet">
          <div class="sh__snippet-bar">
            <span class="sh__snippet-dot" style="background:#ff5f57"></span>
            <span class="sh__snippet-dot" style="background:#febc2e"></span>
            <span class="sh__snippet-dot" style="background:#28c840"></span>
            <span style="flex:1;text-align:center;font-size:0.7rem;color:#6b7280">
              {selectedDoc?.title || 'note'}.{FORMAT_OPTS.find(f=>f.id===selectedFormat)?.ext}
            </span>
            <button class="sh__snippet-copy" on:click={handleCopy}>Copy</button>
          </div>
          <pre class="sh__snippet-code">{previewContent}</pre>
        </div>

      {:else}
        <!-- Prose preview -->
        <div class="sh__preview-prose">
          <pre class="sh__preview-text">{previewContent}</pre>
        </div>
      {/if}
    </div>
  </div>

  <!-- ── Export history ────────────────────────────────────────────────────── -->
  {#if exportHistory.length > 0}
    <div class="sh__history">
      <div class="sh__history-header">
        <h2 class="sh__history-title">Recent Exports</h2>
        <button class="sh__history-clear" on:click={clearHistory}>Clear history</button>
      </div>
      <div class="sh__history-list">
        {#each exportHistory as item}
          <div class="sh__history-item">
            <span class="sh__history-icon">📦</span>
            <div class="sh__history-info">
              <div class="sh__history-name">{item.filename}</div>
              <div class="sh__history-meta">
                {item.docTitle} · {item.format} ·
                {new Date(item.exportedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .sh {
    height: 100%;
    overflow-y: auto;
    background: var(--clr-bg);
    display: flex;
    flex-direction: column;
  }

  /* ── Hero ────────────────────────────────────────────────────────────────── */
  .sh__hero {
    position: relative;
    background: linear-gradient(135deg, #0a1628 0%, #1e0a3c 60%, #0a1628 100%);
    padding: 40px 48px 36px;
    overflow: hidden;
    flex-shrink: 0;
  }
  .sh__hero-bg {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 50% 100% at 80% 50%, rgba(139,92,246,0.15) 0%, transparent 60%),
      radial-gradient(ellipse 30% 60% at 10% 20%, rgba(16,185,129,0.10) 0%, transparent 50%);
    pointer-events: none;
  }
  .sh__hero-inner {
    position: relative;
    max-width: 1100px;
    margin: 0 auto;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 32px;
    flex-wrap: wrap;
  }
  .sh__hero-title {
    font-size: 2rem;
    font-weight: 800;
    color: #f1f5f9;
    margin-bottom: 8px;
  }
  .sh__hero-sub {
    font-size: 0.9rem;
    color: rgba(148,163,184,0.8);
    max-width: 500px;
    line-height: 1.6;
  }
  .sh__hero-formats { display: flex; gap: 8px; flex-wrap: wrap; }

  .sh__fmt-badge {
    padding: 6px 14px;
    border-radius: var(--r-full);
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    color: rgba(203,213,225,0.8);
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.18s;
  }
  .sh__fmt-badge:hover { background: rgba(139,92,246,0.2); border-color: rgba(139,92,246,0.4); color: #f1f5f9; }
  .sh__fmt-badge--active { background: rgba(139,92,246,0.3); border-color: rgba(139,92,246,0.6); color: #a78bfa; }

  /* ── Body ────────────────────────────────────────────────────────────────── */
  .sh__body {
    flex: 1;
    display: flex;
    gap: 0;
    min-height: 0;
    max-width: 1100px;
    margin: 0 auto;
    width: 100%;
    padding: 32px 48px;
    gap: 24px;
    box-sizing: border-box;
    align-items: flex-start;
  }

  /* ── Left panel ──────────────────────────────────────────────────────────── */
  .sh__panel--left {
    width: 320px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .sh__field {}
  .sh__label {
    display: block;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--clr-text-muted);
    margin-bottom: 8px;
  }

  .sh__select-wrap { position: relative; }
  .sh__select {
    width: 100%;
    padding: 10px 14px;
    background: var(--clr-surface);
    border: 1px solid var(--clr-border);
    border-radius: 10px;
    color: var(--clr-text-primary);
    font-size: 0.88rem;
    font-family: inherit;
    outline: none;
    cursor: pointer;
    appearance: none;
    transition: border-color 0.15s;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    background-size: 16px;
    padding-right: 36px;
  }
  .sh__select:focus { border-color: var(--clr-accent); }

  /* Format cards */
  .sh__format-cards { display: flex; gap: 8px; }
  .sh__fmt-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 12px 8px;
    background: var(--clr-surface);
    border: 1px solid var(--clr-border);
    border-radius: 12px;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.18s;
    color: var(--clr-text-secondary);
  }
  .sh__fmt-card:hover { border-color: var(--clr-accent); background: var(--clr-surface2); }
  .sh__fmt-card--active {
    border-color: var(--clr-accent);
    background: rgba(139,92,246,0.12);
    color: var(--clr-accent);
  }
  .sh__fmt-card-icon { font-size: 1.3rem; }
  .sh__fmt-card-name { font-size: 0.75rem; font-weight: 700; }
  .sh__fmt-card-ext  { font-size: 0.65rem; color: var(--clr-text-muted); }

  /* Meta */
  .sh__meta {
    display: flex;
    gap: 8px;
    font-size: 0.78rem;
    color: var(--clr-text-muted);
    background: var(--clr-surface);
    border: 1px solid var(--clr-border);
    border-radius: 10px;
    padding: 10px 14px;
  }

  /* Action buttons */
  .sh__actions { display: flex; flex-direction: column; gap: 10px; }

  .sh__btn {
    width: 100%;
    padding: 12px 16px;
    border-radius: 10px;
    border: 1px solid var(--clr-border);
    background: var(--clr-surface);
    color: var(--clr-text-primary);
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.18s;
  }
  .sh__btn:hover:not(:disabled) { background: var(--clr-surface2); border-color: var(--clr-accent); }
  .sh__btn:disabled { opacity: 0.45; cursor: not-allowed; }

  .sh__btn--primary {
    background: linear-gradient(135deg, #8b5cf6, #6d28d9);
    border-color: transparent;
    color: white;
    box-shadow: 0 4px 14px rgba(139,92,246,0.35);
  }
  .sh__btn--primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #7c3aed, #5b21b6);
    border-color: transparent;
    box-shadow: 0 6px 20px rgba(139,92,246,0.5);
    transform: translateY(-1px);
  }

  .sh__btn--ghost {
    background: transparent;
    border-style: dashed;
  }
  .sh__btn--ghost:hover:not(:disabled) { background: var(--clr-surface); border-style: solid; }

  /* Spinner */
  .sh__spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: inline-block;
  }
  .sh__spinner--lg { width: 28px; height: 28px; border-color: var(--clr-border); border-top-color: var(--clr-accent); }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Right panel (preview) ───────────────────────────────────────────────── */
  .sh__panel--right {
    flex: 1;
    min-width: 0;
    background: var(--clr-surface);
    border: 1px solid var(--clr-border);
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 420px;
  }

  .sh__preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 18px;
    border-bottom: 1px solid var(--clr-border);
    background: var(--clr-surface2);
    flex-shrink: 0;
  }
  .sh__preview-label  { font-size: 0.85rem; font-weight: 600; color: var(--clr-text-primary); }
  .sh__preview-format { font-size: 0.72rem; color: var(--clr-accent); font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }

  .sh__preview-empty,
  .sh__preview-loading {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: var(--clr-text-muted);
    font-size: 0.88rem;
  }
  .sh__preview-empty span { font-size: 2.5rem; opacity: 0.3; }

  .sh__preview-prose {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }
  .sh__preview-text {
    font-size: 0.82rem;
    line-height: 1.7;
    color: var(--clr-text-secondary);
    white-space: pre-wrap;
    font-family: 'Fira Code', 'Cascadia Code', monospace;
    margin: 0;
    word-break: break-word;
  }

  /* Snippet view */
  .sh__snippet { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .sh__snippet-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: #1a1a2e;
    border-bottom: 1px solid var(--clr-border);
    flex-shrink: 0;
  }
  .sh__snippet-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
  .sh__snippet-copy {
    padding: 3px 10px;
    background: rgba(139,92,246,0.2);
    border: 1px solid rgba(139,92,246,0.4);
    border-radius: 5px;
    color: #a78bfa;
    font-size: 0.72rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;
  }
  .sh__snippet-copy:hover { background: rgba(139,92,246,0.35); }
  .sh__snippet-code {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    background: #0d1117;
    color: #c9d1d9;
    font-size: 0.78rem;
    font-family: 'Fira Code', 'Cascadia Code', monospace;
    line-height: 1.7;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
  }

  /* ── Export history ──────────────────────────────────────────────────────── */
  .sh__history {
    max-width: 1100px;
    margin: 0 auto;
    width: 100%;
    padding: 0 48px 48px;
    box-sizing: border-box;
  }
  .sh__history-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .sh__history-title { font-size: 1rem; font-weight: 700; color: var(--clr-text-primary); }
  .sh__history-clear {
    font-size: 0.78rem;
    color: var(--clr-text-muted);
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    transition: color 0.15s;
  }
  .sh__history-clear:hover { color: #f87171; }

  .sh__history-list { display: flex; flex-direction: column; gap: 8px; }
  .sh__history-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--clr-surface);
    border: 1px solid var(--clr-border);
    border-radius: 10px;
  }
  .sh__history-icon { font-size: 1.2rem; }
  .sh__history-info { flex: 1; min-width: 0; }
  .sh__history-name { font-size: 0.85rem; font-weight: 600; color: var(--clr-text-primary); }
  .sh__history-meta { font-size: 0.72rem; color: var(--clr-text-muted); margin-top: 2px; }
</style>
