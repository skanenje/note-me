<script>
    import { toast } from "../stores/toast.js";
    import { createDocument } from "../stores/documents.js";

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
    let isSavingNote = false;

    function enhancerMounted(node) {
        loadFrameworks();
        loadHistory();
        return {
            destroy() {}
        };
    }

    async function loadFrameworks() {
        error = null;
        try {
            const result = await window.api.getFrameworks();

            if (result.success) {
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
        explanations = []; 
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
            const result = await window.api.enhancePrompt({
                prompt: prompt.trim(),
                framework_id: selectedFramework,
                explain: showExplanation,
            });

            if (result.success) {
                const data = result.enhancement;
                enhancedPrompt  = data.enhanced_prompt;
                qualityMetrics  = data.quality;
                explanations    = data.explain ?? [];
                toast.success("Prompt enhanced!");
                await loadHistory();
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

    async function saveAsNote() {
        if (!enhancedPrompt) return;
        isSavingNote = true;
        try {
            const title = "Enhanced: " + (frameworks.find(f => f.id === selectedFramework)?.name || "Prompt");
            const doc = await createDocument(title);
            
            await window.api.createBlock({
                documentId: doc.id,
                type: 'paragraph',
                content: enhancedPrompt
            });
            
            toast.success("Saved as new note!");
        } catch (err) {
            toast.error("Failed to save note: " + err.message);
        } finally {
            isSavingNote = false;
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

<div class="h-full flex flex-col bg-background text-on-surface" use:enhancerMounted>
    <!-- Header -->
    <header class="px-8 py-5 border-b border-outline-variant bg-surface shrink-0 flex justify-between items-center">
        <div>
            <h1 class="text-2xl font-bold flex items-center gap-2">
                <span class="text-[28px]">✨</span>
                Prompt Enhancer
            </h1>
            <p class="text-on-surface-variant mt-1 text-sm">Transform your prompts with AI-powered learning frameworks</p>
        </div>
        <button 
            class="flex items-center gap-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant rounded-lg px-4 py-2 text-sm font-semibold transition-colors text-on-surface" 
            on:click={() => showHistory = !showHistory}
        >
            <span>⏱️</span>
            History ({history.length})
        </button>
    </header>

    {#if error && !enhancedPrompt}
        <div class="m-4 p-4 bg-error-container text-on-error-container rounded-lg border border-error flex items-center gap-2 shrink-0">
            <span>⚠</span>
            <span class="text-sm font-medium">{error}</span>
        </div>
    {/if}

    <!-- Main Grid -->
    <div class="flex-1 flex overflow-hidden p-5 gap-5">
        
        <!-- History Sidebar -->
        {#if showHistory}
            <div class="w-64 bg-surface border border-outline-variant rounded-xl flex flex-col overflow-hidden shrink-0">
                <div class="p-4 border-b border-outline-variant bg-surface-container-lowest">
                    <h3 class="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Recent Enhancements</h3>
                </div>
                <div class="flex-1 overflow-y-auto p-2">
                    {#if history.length === 0}
                        <div class="p-4 text-center text-sm text-on-surface-variant">No history yet.</div>
                    {:else}
                        {#each history as item}
                            <div 
                                role="button" 
                                tabindex="0" 
                                class="p-3 rounded-lg hover:bg-surface-container-high cursor-pointer transition-colors border border-transparent hover:border-outline-variant mb-1 group text-left" 
                                on:click={() => loadFromHistory(item)}
                                on:keydown={(e) => e.key === 'Enter' && loadFromHistory(item)}
                            >
                                <div class="flex justify-between items-center mb-2">
                                    <span class="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-wider">
                                        {frameworks.find(f => f.id === item.framework)?.name || item.framework}
                                    </span>
                                    <div class="flex items-center gap-1">
                                        <span class="font-bold text-sm" style="color:{scoreColor(item.score)}">{letterGrade(item.score)}</span>
                                        <button 
                                            class="opacity-0 group-hover:opacity-100 text-[14px] text-on-surface-variant hover:text-error transition-all" 
                                            on:click={(e) => deleteHistoryItem(item.id, e)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                                <p class="text-xs text-on-surface-variant truncate mb-1 font-medium">{item.original}</p>
                                <p class="text-[10px] text-on-surface-variant/60">{formatDate(item.created_at)}</p>
                            </div>
                        {/each}
                    {/if}
                </div>
            </div>
        {/if}

        <div class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-5 overflow-hidden">
            <!-- Input Panel -->
            <div class="bg-surface border border-outline-variant rounded-xl p-6 flex flex-col overflow-y-auto">
                <h2 class="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
                    <span class="text-primary">✎</span> Your Prompt
                </h2>
                
                <div class="mb-4">
                    <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Learning Framework</label>
                    <select 
                        bind:value={selectedFramework} 
                        class="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-on-surface"
                    >
                        {#if frameworks.length === 0}
                            <option value="">Loading frameworks...</option>
                        {/if}
                        {#each frameworks as fw (fw.id)}
                            <option value={fw.id}>{fw.name} — {fw.description}</option>
                        {/each}
                    </select>
                </div>

                <div class="mb-4 flex-1 flex flex-col">
                    <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Prompt Text</label>
                    <textarea 
                        bind:value={prompt} 
                        placeholder="Type or paste your prompt here…" 
                        class="w-full flex-1 bg-surface-container-low border border-outline-variant rounded-lg p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-on-surface resize-none leading-relaxed" 
                        disabled={isLoading}
                    ></textarea>
                    <div class="text-right text-[10px] font-medium text-on-surface-variant mt-2">
                        {prompt.length} characters · {prompt.trim().split(/\s+/).filter(Boolean).length} words
                    </div>
                </div>

                <label class="flex items-center gap-2 mb-6 cursor-pointer w-fit group">
                    <input 
                        type="checkbox" 
                        bind:checked={showExplanation} 
                        disabled={isLoading} 
                        class="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary bg-surface-container-lowest" 
                    />
                    <span class="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">Include enhancement explanations</span>
                </label>

                <div class="flex gap-4 mt-auto pt-4 border-t border-outline-variant">
                    <button 
                        on:click={handleEnhance} 
                        disabled={isLoading || !prompt.trim()} 
                        class="flex-1 bg-primary text-on-primary font-bold rounded-lg py-3 px-6 transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
                    >
                        {#if isLoading}
                            <span>⏳</span> Enhancing…
                        {:else}
                            <span>🚀</span> Enhance
                        {/if}
                    </button>
                    <button 
                        on:click={clearAll} 
                        disabled={isLoading} 
                        class="bg-surface-container-high text-on-surface font-bold rounded-lg py-3 px-6 hover:bg-surface-container-highest border border-outline-variant transition-colors disabled:opacity-50"
                    >
                        Clear
                    </button>
                </div>
            </div>

            <!-- Output Panel -->
            <div class="bg-surface border border-outline-variant rounded-xl p-6 flex flex-col overflow-y-auto relative transition-colors duration-300" class:border-primary={enhancedPrompt}>
                {#if enhancedPrompt}
                    <div class="flex justify-between items-center mb-4 sticky top-0 bg-surface z-10 pb-2 border-b border-outline-variant">
                        <h2 class="text-lg font-bold text-on-surface flex items-center gap-2">
                            <span class="text-success">✅</span> Enhanced
                        </h2>
                        <div class="flex gap-2">
                            <button 
                                on:click={saveAsNote} 
                                disabled={isSavingNote} 
                                class="flex items-center gap-1 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant rounded-full px-3 py-1 text-xs font-semibold transition-colors"
                            >
                                📝 {isSavingNote ? 'Saving...' : 'Save Note'}
                            </button>
                            <button 
                                on:click={copyToClipboard} 
                                class="flex items-center gap-1 bg-success/10 hover:bg-success/20 border border-success/30 text-success rounded-full px-3 py-1 text-xs font-semibold transition-colors"
                            >
                                📋 {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>

                    <div class="bg-surface-container-lowest border border-outline-variant border-l-4 border-l-primary rounded-lg p-4 mb-6">
                        <p class="text-sm text-on-surface whitespace-pre-wrap leading-relaxed">{enhancedPrompt}</p>
                    </div>

                    {#if qualityMetrics}
                        <div class="mb-6">
                            <h3 class="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-4 flex items-center gap-1">
                                📊 Quality Metrics
                            </h3>
                            <div class="grid grid-cols-1 gap-3 bg-surface-container-lowest border border-outline-variant rounded-lg p-4">
                                {#each [{label:'Overall Score',k:'overall'},{label:'Clarity',k:'clarity'},{label:'Specificity',k:'specificity'},{label:'Context Richness',k:'context_richness'},{label:'Actionability',k:'actionability'}] as m}
                                    <div>
                                        <div class="flex justify-between text-xs mb-1">
                                            <span class="text-on-surface-variant font-medium">{m.label}</span>
                                            <span class="font-bold" style="color:{scoreColor(qualityMetrics[m.k])}">
                                                {qualityMetrics[m.k]?.toFixed(1)} <span class="opacity-70 text-[10px]">({letterGrade(qualityMetrics[m.k])})</span>
                                            </span>
                                        </div>
                                        <div class="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                                            <div class="h-full rounded-full transition-all duration-700 ease-out" style="width:{(qualityMetrics[m.k]/10)*100}%; background:{scoreColor(qualityMetrics[m.k])}"></div>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}

                    {#if explanations.length > 0}
                        <div>
                            <h3 class="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-4 flex items-center gap-1">
                                ℹ Enhancement Details
                            </h3>
                            <ul class="flex flex-col gap-2">
                                {#each explanations as exp}
                                    <li class="flex items-start gap-2 text-sm text-on-surface-variant bg-surface-container-lowest p-3 rounded-lg border border-outline-variant">
                                        <span class="text-success mt-0.5">✓</span>
                                        <span class="leading-relaxed">{exp}</span>
                                    </li>
                                {/each}
                            </ul>
                        </div>
                    {/if}
    @keyframes slideUp {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
    }
</style>
