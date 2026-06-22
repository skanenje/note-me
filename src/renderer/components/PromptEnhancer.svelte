<script>
    import { onMount } from "svelte";
    import { toast } from "../stores/toast.js";

    let frameworks = [];
    let selectedFramework = "";
    let prompt = "";
    let enhancedPrompt = "";
    let qualityMetrics = null;
    let isLoading = false;
    let showExplanation = false;
    let explanations = [];
    let error = null;
    let copied = false;
    let history = [];
    let showHistory = false;

    onMount(async () => {
        await loadFrameworks();
        await loadHistory();
    });

    async function loadFrameworks() {
        error = null;
        try {
            // FIX 1: Use window.api.getFrameworks() — not window.electronAPI.invoke()
            const result = await window.api.getFrameworks();

            if (result.success) {
                // FIX 2: Response shape is { success, frameworks } — not result.data.frameworks
                frameworks = result.frameworks ?? [];
                if (frameworks.length > 0) {
                    selectedFramework = frameworks[0].id;
                }
            } else {
                error = `Failed to load frameworks: ${result.error}`;
            }
        } catch (err) {
            error = `Error loading frameworks: ${err.message}`;
            console.error(err);
        }
    }

    async function loadHistory() {
        try {
            const result = await window.api.getPromptHistory(20);
            if (result.success) {
                history = result.history || [];
            }
        } catch (err) {
            console.error("Failed to load prompt history:", err);
        }
    }

    async function deleteHistoryItem(id, e) {
        if (e) e.stopPropagation();
        try {
            const result = await window.api.deletePromptHistory(id);
            if (result.success) {
                history = history.filter(h => h.id !== id);
                toast.success("History item deleted");
            }
        } catch (err) {
            console.error("Failed to delete history item:", err);
            toast.error("Failed to delete item");
        }
    }

    function loadFromHistory(item) {
        prompt = item.original;
        enhancedPrompt = item.enhanced;
        selectedFramework = item.framework;
        qualityMetrics = item.score ? { overall: item.score } : null;
        explanations = []; // We don't save explanations currently
        showHistory = false;
    }

    async function handleEnhance() {
        if (!prompt.trim()) {
            toast.error("Please enter a prompt to enhance");
            return;
        }
        if (!selectedFramework) {
            toast.error("Please select a framework");
            return;
        }

        isLoading = true;
        error = null;
        enhancedPrompt = "";
        qualityMetrics = null;
        explanations = [];

        try {
            // FIX 3: Use window.api.enhancePrompt() — not window.electronAPI.invoke()
            const result = await window.api.enhancePrompt({
                prompt: prompt.trim(),
                framework_id: selectedFramework,
                explain: showExplanation,
            });

            if (result.success) {
                // FIX 4: Response shape is { success, enhancement } — enhancement has the data
                const data = result.enhancement;
                enhancedPrompt  = data.enhanced_prompt;
                qualityMetrics  = data.quality;
                explanations    = data.explain ?? [];
                toast.success("Prompt enhanced!");
                await loadHistory(); // refresh history
            } else {
                error = `Enhancement failed: ${result.error}`;
                toast.error(error);
            }
        } catch (err) {
            error = `Error during enhancement: ${err.message}`;
            toast.error(error);
            console.error(err);
        } finally {
            isLoading = false;
        }
    }

    async function copyToClipboard() {
        try {
            await navigator.clipboard.writeText(enhancedPrompt);
            copied = true;
            toast.success("Copied to clipboard!");
            setTimeout(() => (copied = false), 2000);
        } catch {
            toast.error("Failed to copy");
        }
    }

    function clearAll() {
        prompt = "";
        enhancedPrompt = "";
        qualityMetrics = null;
        explanations = [];
        error = null;
        showExplanation = false;
    }

    function scoreColor(val) {
        if (val >= 7.5) return '#10b981';
        if (val >= 5)   return '#f59e0b';
        return '#ef4444';
    }

    function letterGrade(val) {
        if (!val) return '';
        if (val >= 9) return 'A';
        if (val >= 8) return 'B';
        if (val >= 7) return 'C';
        if (val >= 6) return 'D';
        return 'F';
    }

    function formatDate(ms) {
        return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
</script>

<div class="pe">
    <!-- Header -->
    <div class="pe__header">
        <div class="pe__header-content">
            <h1 class="pe__title">Prompt Enhancer</h1>
            <p class="pe__subtitle">Transform your prompts with AI-powered learning frameworks</p>
        </div>
        <button class="pe__history-toggle" on:click={() => showHistory = !showHistory}>
            ⏱️ History ({history.length})
        </button>
    </div>

    {#if error && !enhancedPrompt}
        <div class="pe__error">
            <span>⚠</span> {error}
        </div>
    {/if}

    <div class="pe__layout" class:pe__layout--with-history={showHistory}>
        
        {#if showHistory}
        <div class="pe__history-sidebar">
            <h3 class="pe__history-title">Recent Enhancements</h3>
            {#if history.length === 0}
                <p class="pe__history-empty">No history yet.</p>
            {:else}
                <div class="pe__history-list">
                    {#each history as item}
                        <div 
                            class="pe__history-item" 
                            role="button" 
                            tabindex="0" 
                            on:click={() => loadFromHistory(item)}
                            on:keydown={(e) => e.key === 'Enter' && loadFromHistory(item)}
                        >
                            <div class="pe__history-item-header">
                                <span class="pe__history-fw">{frameworks.find(f => f.id === item.framework)?.name || item.framework}</span>
                                <span class="pe__history-score" style="color:{scoreColor(item.score)}">{letterGrade(item.score)}</span>
                                <button class="pe__history-del" on:click={(e) => deleteHistoryItem(item.id, e)}>×</button>
                            </div>
                            <p class="pe__history-preview">{item.original}</p>
                            <span class="pe__history-date">{formatDate(item.created_at)}</span>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
        {/if}

        <!-- Left: Input Panel -->
        <div class="pe__panel">
            <div class="pe__card">
                <h2 class="pe__card-title">Your Prompt</h2>

                <!-- Framework selector -->
                <div class="pe__field">
                    <label class="pe__label" for="fw-select">Learning Framework</label>
                    {#if frameworks.length === 0}
                        <div class="pe__fw-loading skeleton" style="height:40px; border-radius:8px;"></div>
                    {:else}
                        <select id="fw-select" class="pe__select" bind:value={selectedFramework}>
                            {#each frameworks as fw (fw.id)}
                                <option value={fw.id}>{fw.name} — {fw.description}</option>
                            {/each}
                        </select>
                    {/if}
                </div>

                <!-- Prompt textarea -->
                <div class="pe__field">
                    <label class="pe__label" for="prompt-input">Prompt Text</label>
                    <textarea
                        id="prompt-input"
                        class="pe__textarea"
                        bind:value={prompt}
                        placeholder="Type or paste your prompt here…"
                        rows="8"
                        disabled={isLoading}
                    ></textarea>
                    <div class="pe__char-count">{prompt.length} characters · {prompt.trim().split(/\s+/).filter(Boolean).length} words</div>
                </div>

                <!-- Explain toggle -->
                <label class="pe__checkbox-row">
                    <input
                        type="checkbox"
                        bind:checked={showExplanation}
                        disabled={isLoading}
                        class="pe__checkbox"
                    />
                    <span class="pe__checkbox-label">Include enhancement explanations</span>
                </label>

                <!-- Actions -->
                <div class="pe__actions">
                    <button
                        class="pe__btn pe__btn--primary"
                        on:click={handleEnhance}
                        disabled={isLoading || !prompt.trim()}
                    >
                        {#if isLoading}
                            <span class="pe__spinner"></span> Enhancing…
                        {:else}
                            🚀 Enhance
                        {/if}
                    </button>
                    <button
                        class="pe__btn pe__btn--ghost"
                        on:click={clearAll}
                        disabled={isLoading}
                    >
                        Clear
                    </button>
                </div>
            </div>
        </div>

        <!-- Right: Output Panel -->
        <div class="pe__panel">
            {#if enhancedPrompt}
                <div class="pe__card pe__card--output">
                    <div class="pe__output-header">
                        <h2 class="pe__card-title" style="margin:0">Enhanced Prompt</h2>
                        <button class="pe__copy-btn" on:click={copyToClipboard}>
                            {copied ? '✓ Copied!' : '📋 Copy'}
                        </button>
                    </div>

                    <div class="pe__output-content">
                        <p class="pe__enhanced-text">{enhancedPrompt}</p>
                    </div>

                    <!-- Quality Metrics -->
                    {#if qualityMetrics}
                        <div class="pe__metrics">
                            <h3 class="pe__section-title">Quality Metrics</h3>
                            <div class="pe__metrics-grid">
                                {#each [
                                    { label: 'Overall',         key: 'overall' },
                                    { label: 'Clarity',         key: 'clarity' },
                                    { label: 'Specificity',     key: 'specificity' },
                                    { label: 'Context',         key: 'context_richness' },
                                    { label: 'Actionability',   key: 'actionability' },
                                ] as m}
                                    <div class="pe__metric">
                                        <div class="pe__metric-row">
                                            <span class="pe__metric-label">{m.label}</span>
                                            <span class="pe__metric-val" style="color:{scoreColor(qualityMetrics[m.key])}">
                                                {qualityMetrics[m.key]?.toFixed(1)} <span class="pe__grade">({letterGrade(qualityMetrics[m.key])})</span>
                                            </span>
                                        </div>
                                        <div class="pe__bar">
                                            <div
                                                class="pe__bar-fill"
                                                style="width:{(qualityMetrics[m.key]/10)*100}%; background:{scoreColor(qualityMetrics[m.key])}"
                                            ></div>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}

                    <!-- Explanations -->
                    {#if explanations.length > 0}
                        <div class="pe__explanations">
                            <h3 class="pe__section-title">Enhancement Details</h3>
                            <ul class="pe__exp-list">
                                {#each explanations as exp}
                                    <li class="pe__exp-item">
                                        <span class="pe__exp-check">✓</span>
                                        {exp}
                                    </li>
                                {/each}
                            </ul>
                        </div>
                    {/if}
                </div>
            {:else}
                <div class="pe__output-placeholder">
                    <div class="pe__placeholder-icon">✨</div>
                    <p class="pe__placeholder-text">Your enhanced prompt will appear here</p>
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    .pe {
        height: 100%;
        display: flex;
        flex-direction: column;
        background: var(--clr-bg);
        overflow: hidden;
    }

    .pe__header {
        background: var(--clr-surface);
        border-bottom: 1px solid var(--clr-border);
        padding: 20px 32px;
        flex-shrink: 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .pe__history-toggle {
        background: var(--clr-surface2);
        border: 1px solid var(--clr-border);
        border-radius: var(--r-md);
        padding: 8px 16px;
        color: var(--clr-text-secondary);
        font-size: 0.85rem;
        cursor: pointer;
        transition: all var(--t-fast);
    }

    .pe__history-toggle:hover {
        background: var(--clr-surface);
        border-color: var(--clr-accent);
        color: var(--clr-text-primary);
    }

    .pe__title {
        font-size: 1.4rem;
        font-weight: 800;
        color: var(--clr-text-primary);
        background: var(--grad-primary);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 4px;
    }

    .pe__subtitle {
        font-size: 0.85rem;
        color: var(--clr-text-secondary);
    }

    .pe__error {
        margin: 12px 32px 0;
        padding: 10px 16px;
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: var(--r-md);
        color: #fca5a5;
        font-size: 0.875rem;
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
    }

    .pe__layout {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        padding: 20px 32px;
        flex: 1;
        overflow-y: auto;
        transition: all var(--t-fast);
    }

    .pe__layout--with-history {
        grid-template-columns: 250px 1fr 1fr;
    }

    .pe__history-sidebar {
        background: var(--clr-surface);
        border: 1px solid var(--clr-border);
        border-radius: var(--r-lg);
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .pe__history-title {
        font-size: 0.85rem;
        font-weight: 700;
        text-transform: uppercase;
        color: var(--clr-text-muted);
        padding: 16px;
        border-bottom: 1px solid var(--clr-border);
    }

    .pe__history-list {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
    }

    .pe__history-empty {
        padding: 16px;
        color: var(--clr-text-muted);
        font-size: 0.85rem;
        text-align: center;
    }

    .pe__history-item {
        padding: 12px;
        border-radius: var(--r-md);
        cursor: pointer;
        transition: background var(--t-fast);
        border: 1px solid transparent;
        margin-bottom: 4px;
    }

    .pe__history-item:hover {
        background: var(--clr-surface2);
        border-color: var(--clr-border);
    }

    .pe__history-item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
    }

    .pe__history-fw {
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--clr-accent);
        background: rgba(124, 58, 237, 0.1);
        padding: 2px 6px;
        border-radius: 4px;
    }

    .pe__history-score {
        font-weight: 800;
        font-size: 0.8rem;
    }

    .pe__history-del {
        background: transparent;
        border: none;
        color: var(--clr-text-muted);
        cursor: pointer;
        font-size: 1.1rem;
        padding: 0 4px;
        border-radius: 4px;
    }
    
    .pe__history-del:hover {
        color: #ef4444;
        background: rgba(239, 68, 68, 0.1);
    }

    .pe__history-preview {
        font-size: 0.8rem;
        color: var(--clr-text-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 6px;
    }

    .pe__history-date {
        font-size: 0.7rem;
        color: var(--clr-text-muted);
    }

    .pe__panel {
        display: flex;
        flex-direction: column;
    }

    .pe__card {
        background: var(--clr-surface);
        border: 1px solid var(--clr-border);
        border-radius: var(--r-lg);
        padding: 24px;
        flex: 1;
    }

    .pe__card--output {
        border-color: rgba(124, 58, 237, 0.3);
        animation: slideUp 300ms ease forwards;
    }

    .pe__card-title {
        font-size: 1rem;
        font-weight: 700;
        color: var(--clr-text-primary);
        margin-bottom: 20px;
    }

    .pe__field {
        margin-bottom: 18px;
    }

    .pe__label {
        display: block;
        font-size: 0.78rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--clr-text-muted);
        margin-bottom: 8px;
    }

    .pe__select {
        width: 100%;
        padding: 10px 12px;
        background: var(--clr-surface2);
        border: 1px solid var(--clr-border);
        border-radius: var(--r-md);
        color: var(--clr-text-primary);
        font-size: 0.875rem;
        cursor: pointer;
        outline: none;
        transition: border-color var(--t-fast);
    }

    .pe__select:focus { border-color: var(--clr-accent); }

    .pe__textarea {
        width: 100%;
        padding: 12px 14px;
        background: var(--clr-surface2);
        border: 1px solid var(--clr-border);
        border-radius: var(--r-md);
        color: var(--clr-text-primary);
        font-size: 0.9rem;
        font-family: inherit;
        line-height: 1.7;
        resize: vertical;
        min-height: 180px;
        outline: none;
        transition: border-color var(--t-fast), box-shadow var(--t-fast);
    }

    .pe__textarea:focus {
        border-color: var(--clr-accent);
        box-shadow: 0 0 0 3px var(--clr-accent-glow);
    }

    .pe__textarea:disabled { opacity: 0.5; cursor: not-allowed; }

    .pe__char-count {
        font-size: 0.7rem;
        color: var(--clr-text-muted);
        margin-top: 5px;
        text-align: right;
    }

    .pe__checkbox-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 20px;
        cursor: pointer;
    }

    .pe__checkbox {
        width: 16px;
        height: 16px;
        accent-color: var(--clr-accent);
        cursor: pointer;
    }

    .pe__checkbox-label {
        font-size: 0.875rem;
        color: var(--clr-text-secondary);
    }

    .pe__actions {
        display: flex;
        gap: 10px;
    }

    .pe__btn {
        flex: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 11px 20px;
        border-radius: var(--r-md);
        font-size: 0.9rem;
        font-weight: 700;
        cursor: pointer;
        transition: all var(--t-fast);
        font-family: inherit;
        border: none;
    }

    .pe__btn--primary {
        background: var(--grad-primary);
        color: white;
    }

    .pe__btn--primary:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px var(--clr-accent-glow);
    }

    .pe__btn--ghost {
        background: transparent;
        border: 1px solid var(--clr-border);
        color: var(--clr-text-secondary);
        flex: 0;
        padding: 11px 16px;
    }

    .pe__btn--ghost:hover:not(:disabled) {
        background: var(--clr-surface2);
        color: var(--clr-text-primary);
    }

    .pe__btn:disabled { opacity: 0.4; cursor: not-allowed; }

    .pe__spinner {
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255,255,255,0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* Output */
    .pe__output-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
    }

    .pe__copy-btn {
        padding: 6px 14px;
        background: rgba(16, 185, 129, 0.15);
        border: 1px solid rgba(16, 185, 129, 0.35);
        border-radius: var(--r-full);
        color: #6ee7b7;
        font-size: 0.78rem;
        font-weight: 700;
        cursor: pointer;
        transition: all var(--t-fast);
        font-family: inherit;
    }

    .pe__copy-btn:hover {
        background: rgba(16, 185, 129, 0.25);
        transform: translateY(-1px);
    }

    .pe__output-content {
        background: var(--clr-surface2);
        border: 1px solid var(--clr-border);
        border-left: 3px solid var(--clr-accent);
        border-radius: var(--r-md);
        padding: 16px;
        margin-bottom: 20px;
    }

    .pe__enhanced-text {
        color: var(--clr-text-primary);
        font-size: 0.9rem;
        line-height: 1.8;
        white-space: pre-wrap;
        word-wrap: break-word;
    }

    /* Metrics */
    .pe__metrics {
        padding-top: 18px;
        border-top: 1px solid var(--clr-border);
        margin-bottom: 16px;
    }

    .pe__section-title {
        font-size: 0.78rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--clr-text-muted);
        margin-bottom: 14px;
    }

    .pe__metrics-grid {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .pe__metric { display: flex; flex-direction: column; gap: 5px; }

    .pe__metric-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .pe__metric-label {
        font-size: 0.8rem;
        color: var(--clr-text-secondary);
    }

    .pe__metric-val {
        font-size: 0.85rem;
        font-weight: 700;
    }
    
    .pe__grade {
        font-weight: 800;
        opacity: 0.8;
        font-size: 0.9rem;
    }

    .pe__bar {
        height: 5px;
        background: var(--clr-surface2);
        border-radius: var(--r-full);
        overflow: hidden;
    }

    .pe__bar-fill {
        height: 100%;
        border-radius: var(--r-full);
        transition: width 600ms cubic-bezier(0.4,0,0.2,1);
        opacity: 0.85;
    }

    /* Explanations */
    .pe__explanations {
        padding-top: 16px;
        border-top: 1px solid var(--clr-border);
    }

    .pe__exp-list {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .pe__exp-item {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        font-size: 0.85rem;
        color: var(--clr-text-secondary);
        line-height: 1.5;
    }

    .pe__exp-check {
        color: var(--clr-success);
        font-weight: 700;
        margin-top: 1px;
        flex-shrink: 0;
    }

    /* Placeholder */
    .pe__output-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        min-height: 300px;
        gap: 14px;
        border: 1px dashed var(--clr-border);
        border-radius: var(--r-lg);
        background: var(--clr-surface);
    }

    .pe__placeholder-icon { font-size: 3rem; opacity: 0.2; }

    .pe__placeholder-text {
        font-size: 0.9rem;
        color: var(--clr-text-muted);
        text-align: center;
    }

    .pe__fw-loading { margin-bottom: 0; }

    @keyframes slideUp {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
    }
</style>
