<script>
    import { onMount } from "svelte";
    let frameworks = [];
    let selectedFramework = "";
    let prompt = "";
    let enhancedPrompt = "";
    let qualityMetrics = null;
    let isLoading = false;
    let error = null;
    let selectedModel = "xiaomi/mimo-v2-flash:free";

    const aiModels = [
        { id: "xiaomi/mimo-v2-flash:free", name: "Mimo V2 Flash" },
        { id: "nvidia/nemotron-3-nano-30b-a3b:free", name: "Nemotron 3 Nano 30B" },
        { id: "mistralai/devstral-2512:free", name: "Devstral 2512" },
        { id: "openrouter/auto", name: "Auto (Best available)" },
        { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet" },
    ];

    onMount(async () => {
    await loadFrameworks();
    selectedFramework = "";
    });

    async function loadFrameworks() {
        try {
            const result = await window.electronAPI.invoke(
                "prompt-enhancer:get-frameworks",
                {}
            );

            if (result.success) {
                frameworks = result.data.frameworks;
            } else {
                error = `Failed to load frameworks: ${result.error}`;
            }
        } catch (err) {
            error = `Error loading frameworks: ${err.message}`;
            console.error(err);
        }
    }
    async function enhancePrompt() {
        if (!prompt.trim()) {
            error = "Please enter a prompt to enhance";
            return;
        }

        isLoading = true;
        error = null;
        enhancedPrompt = "";
        qualityMetrics = null;

        try {
            console.log('[UI] Starting enhancement with model:', selectedModel);
            console.log('[UI] Prompt:', prompt.trim());
            
            const requestPayload = {
                prompt: prompt.trim(),
                model: selectedModel,
                framework_id: selectedFramework,
            };
            console.log('[UI] Request payload:', JSON.stringify(requestPayload, null, 2));
            
            const result = await window.electronAPI.invoke(
                "prompt-enhancer:enhance",
                requestPayload
            );

            console.log('[UI] Response received:', JSON.stringify(result, null, 2));

            if (result.success) {
                const data = result.data;
                console.log('[UI] Enhancement successful');
                enhancedPrompt = data.enhanced_prompt;
                qualityMetrics = data.quality;
            } else {
                error = `Enhancement failed: ${result.error}`;
                console.error('[UI] Enhancement error:', error);
            }
        } catch (err) {
            error = `Error during enhancement: ${err.message}`;
            console.error('[UI] Exception caught:', err);
        } finally {
            isLoading = false;
        }
    }

    function copyToClipboard() {
        navigator.clipboard.writeText(enhancedPrompt);
        // Visual feedback could be added here
    }

    function clearAll() {
        prompt = "";
        enhancedPrompt = "";
        qualityMetrics = null;
        error = null;
    }
</script>

<div class="flex flex-col h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 p-4 md:p-8 overflow-y-auto">
    <div class="text-center mb-6 md:mb-8">
        <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-1 md:mb-2">🚀 Prompt Enhancer</h1>
        <p class="text-base md:text-lg text-gray-600">Powered by OpenRouter AI for intelligent prompt enhancement</p>
    </div>

    {#if error}
        <div class="px-4 py-3 rounded-lg mb-4 bg-red-100 text-red-700 border border-red-300">
            {error}
        </div>
    {/if}

    <div class="flex flex-col gap-6 md:gap-8 max-w-5xl mx-auto w-full px-0">
        <!-- Input Section -->
        <div class="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-gray-100">
            <h2 class="text-xl md:text-2xl font-semibold text-gray-900 mb-6">Enhance Your Prompt</h2>

            <div class="flex flex-col mb-6">
                <label for="model-select" class="font-medium text-gray-700 mb-2 text-sm">AI Model</label>
                <select bind:value={selectedModel} id="model-select" disabled={isLoading} class="px-3 py-2 border-2 border-indigo-200 rounded-lg text-sm md:text-base font-inherit transition-colors focus:outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 bg-indigo-50">
                    {#each aiModels as model (model.id)}
                        <option value={model.id}>
                            {model.name}
                        </option>
                    {/each}
                </select>
            </div>
            
            <div class="flex flex-col lg:flex-row gap-6 mb-6">
                <div class="flex-1">
                    <label for="framework-select" class="font-medium text-gray-700 mb-2 text-sm block">Framework</label>
                    <select bind:value={selectedFramework} id="framework-select" class="w-full px-3 py-2 border-2 border-gray-100 rounded-lg text-sm md:text-base font-inherit transition-colors focus:outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 truncate">
                        <option value="">None</option>
                        {#each frameworks as fw (fw.id)}
                            <option value={fw.id} class="truncate">
                                {fw.name}
                            </option>
                        {/each}
                    </select>
                    
                    {#if selectedFramework}
                        {@const selectedFw = frameworks.find(fw => fw.id === selectedFramework)}
                        {#if selectedFw}
                            <div class="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-gray-700">
                                <p class="font-medium text-indigo-900 mb-1">{selectedFw.name}</p>
                                <p class="text-gray-600">{selectedFw.description}</p>
                            </div>
                        {/if}
                    {/if}
                </div>
            </div>
            
            <div class="flex flex-col mb-6">
                <label for="prompt-input" class="font-medium text-gray-700 mb-2 text-sm">Your Prompt</label>
                <textarea
                    id="prompt-input"
                    bind:value={prompt}
                    placeholder="Type or paste your prompt here..."
                    disabled={isLoading}
                    class="px-3 py-2 border-2 border-gray-100 rounded-lg text-base font-inherit transition-colors focus:outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 min-h-32 resize-y"
                />
            </div>
            
            <div class="flex flex-col sm:flex-row gap-4 mt-8">
                <button
                    class="flex-1 px-4 md:px-6 py-2 md:py-3 border-none rounded-lg text-sm md:text-base font-semibold cursor-pointer transition-all bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    on:click={enhancePrompt}
                    disabled={isLoading || !prompt.trim()}
                >
                    {isLoading ? "Enhancing..." : "Enhance Prompt"}
                </button>
                <button class="flex-1 px-4 md:px-6 py-2 md:py-3 border-none rounded-lg text-sm md:text-base font-semibold cursor-pointer transition-all bg-gray-100 text-gray-800 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" on:click={clearAll} disabled={isLoading}>
                    Clear
                </button>
            </div>
        </div>

        <!-- Output Section -->
        {#if enhancedPrompt}
            <div class="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-gray-100">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h2 class="text-xl md:text-2xl font-semibold text-gray-900">Enhanced Prompt</h2>
                    <button class="w-full sm:w-auto px-4 py-2 bg-green-500 text-white border-none rounded-lg cursor-pointer font-semibold transition-colors hover:bg-green-600 text-sm md:text-base whitespace-nowrap" on:click={copyToClipboard} title="Copy to clipboard">
                        📋 Copy
                    </button>
                </div>

                <div class="bg-blue-50 px-6 py-6 rounded-lg border-l-4 border-indigo-500 mb-6 whitespace-pre-wrap break-words leading-relaxed text-gray-800">
                    <p>{enhancedPrompt}</p>
                </div>

                <!-- Quality Metrics -->
                {#if qualityMetrics}
                    <div class="mb-8 pt-6 border-t border-gray-100">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Quality Metrics</h3>
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
                            <div class="flex flex-col gap-2">
                                <span class="text-sm font-medium text-gray-600">Overall Score</span>
                                <span class="text-xl font-bold text-indigo-500">{qualityMetrics.overall.toFixed(1)}/10</span>
                                <div class="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        class="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all"
                                        style="width: {(qualityMetrics.overall / 10) * 100}%"
                                    />
                                </div>
                            </div>
                            <div class="flex flex-col gap-2">
                                <span class="text-sm font-medium text-gray-600">Clarity</span>
                                <span class="text-xl font-bold text-indigo-500">{qualityMetrics.clarity.toFixed(1)}/10</span>
                                <div class="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        class="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all"
                                        style="width: {(qualityMetrics.clarity / 10) * 100}%"
                                    />
                                </div>
                            </div>
                            <div class="flex flex-col gap-2">
                                <span class="text-sm font-medium text-gray-600">Specificity</span>
                                <span class="text-xl font-bold text-indigo-500">{qualityMetrics.specificity.toFixed(1)}/10</span>
                                <div class="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        class="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all"
                                        style="width: {(qualityMetrics.specificity / 10) * 100}%"
                                    />
                                </div>
                            </div>
                            <div class="flex flex-col gap-2">
                                <span class="text-sm font-medium text-gray-600">Context Richness</span>
                                <span class="text-xl font-bold text-indigo-500">{qualityMetrics.context_richness.toFixed(1)}/10</span>
                                <div class="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        class="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all"
                                        style="width: {(qualityMetrics.context_richness / 10) * 100}%"
                                    />
                                </div>
                            </div>
                            <div class="flex flex-col gap-2">
                                <span class="text-sm font-medium text-gray-600">Actionability</span>
                                <span class="text-xl font-bold text-indigo-500">{qualityMetrics.actionability.toFixed(1)}/10</span>
                                <div class="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        class="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all"
                                        style="width: {(qualityMetrics.actionability / 10) * 100}%"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                {/if}

            </div>
        {/if}
    </div>
</div>
