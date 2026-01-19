<script>
    import { onMount } from "svelte";
    import { writable } from "svelte/store";

    let frameworks = [];
    let selectedFramework = "";
    let prompt = "";
    let enhancedPrompt = "";
    let qualityMetrics = null;
    let isLoading = false;
    let showExplanation = false;
    let explanations = [];
    let error = null;
    let useAI = false;
    let selectedModel = "nvidia/nemotron-3-nano-30b-a3b:free";

    const aiModels = [
        { id: "nvidia/nemotron-3-nano-30b-a3b:free", name: "Nvidia Nemotron 3 Nano (Free)" },
        { id: "openrouter/auto", name: "Auto (Best available)" },
        { id: "meta-llama/llama-3-8b-instruct:free", name: "Llama 3 8B (Free)" },
        { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
        { id: "gpt-4", name: "GPT-4" },
    ];

    onMount(async () => {
        await loadFrameworks();
    });

    async function loadFrameworks() {
        try {
            const result = await window.electronAPI.invoke(
                "prompt-enhancer:get-frameworks",
                {}
            );

            if (result.success) {
                frameworks = result.data.frameworks;
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

    async function enhancePrompt() {
        if (!prompt.trim()) {
            error = "Please enter a prompt to enhance";
            return;
        }

        if (!useAI && !selectedFramework) {
            error = "Please select a framework or enable AI enhancement";
            return;
        }

        isLoading = true;
        error = null;
        enhancedPrompt = "";
        qualityMetrics = null;
        explanations = [];

        try {
            const result = await window.electronAPI.invoke(
                "prompt-enhancer:enhance",
                {
                    prompt: prompt.trim(),
                    framework_id: useAI ? null : selectedFramework,
                    explain: showExplanation,
                    use_ai: useAI,
                    model: selectedModel,
                }
            );

            if (result.success) {
                const data = result.data;
                enhancedPrompt = data.enhanced_prompt;
                qualityMetrics = data.quality;
                explanations = data.explain || [];
            } else {
                error = `Enhancement failed: ${result.error}`;
            }
        } catch (err) {
            error = `Error during enhancement: ${err.message}`;
            console.error(err);
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
        explanations = [];
        error = null;
        showExplanation = false;
    }
</script>

<div class="flex flex-col h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 p-8 overflow-y-auto">
    <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-900 mb-2">🚀 Prompt Enhancer</h1>
        <p class="text-lg text-gray-600">Transform your prompts with AI-powered learning frameworks</p>
    </div>

    {#if error}
        <div class="px-4 py-3 rounded-lg mb-4 bg-red-100 text-red-700 border border-red-300">
            {error}
        </div>
    {/if}

    <div class="flex flex-col gap-8 max-w-4xl mx-auto w-full">
        <!-- Input Section -->
        <div class="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
            <h2 class="text-2xl font-semibold text-gray-900 mb-6">Enter Your Prompt</h2>

            <div class="flex flex-row gap-6 mb-6">
                <div class="flex-1">
                    <label for="framework-select" class="font-medium text-gray-700 mb-2 text-sm">Learning Framework</label>
                    <select bind:value={selectedFramework} id="framework-select" disabled={useAI || isLoading} class="w-full px-3 py-2 border-2 border-gray-100 rounded-lg text-base font-inherit transition-colors focus:outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed">
                        {#each frameworks as fw (fw.id)}
                            <option value={fw.id}>
                                {fw.name} — {fw.description}
                            </option>
                        {/each}
                    </select>
                </div>
                
                <div class="flex flex-col justify-center">
                    <div class="flex items-center gap-3 h-full">
                        <input
                            type="checkbox"
                            id="ai-toggle"
                            bind:checked={useAI}
                            disabled={isLoading}
                            class="w-5 h-5 cursor-pointer"
                        />
                        <label for="ai-toggle" class="text-gray-700 cursor-pointer font-medium whitespace-nowrap">Use AI Enhancement</label>
                    </div>
                </div>
            </div>

            {#if useAI}
                <div class="flex flex-col mb-6">
                    <label for="model-select" class="font-medium text-gray-700 mb-2 text-sm">AI Model</label>
                    <select bind:value={selectedModel} id="model-select" disabled={isLoading} class="px-3 py-2 border-2 border-indigo-200 rounded-lg text-base font-inherit transition-colors focus:outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 bg-indigo-50">
                        {#each aiModels as model (model.id)}
                            <option value={model.id}>
                                {model.name}
                            </option>
                        {/each}
                    </select>
                </div>
            {/if}

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

            <div class="flex flex-row items-center gap-3 mb-6">
                <input
                    type="checkbox"
                    id="explain-checkbox"
                    bind:checked={showExplanation}
                    disabled={isLoading}
                    class="w-4 h-4 cursor-pointer"
                />
                <label for="explain-checkbox" class="text-gray-700 cursor-pointer">Include explanations</label>
            </div>

            <div class="flex gap-4 mt-8">
                <button
                    class="flex-1 px-6 py-3 border-none rounded-lg text-base font-semibold cursor-pointer transition-all bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    on:click={enhancePrompt}
                    disabled={isLoading || !prompt.trim()}
                >
                    {isLoading ? "Enhancing..." : "Enhance Prompt"}
                </button>
                <button class="flex-1 px-6 py-3 border-none rounded-lg text-base font-semibold cursor-pointer transition-all bg-gray-100 text-gray-800 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" on:click={clearAll} disabled={isLoading}>
                    Clear
                </button>
            </div>
        </div>

        <!-- Output Section -->
        {#if enhancedPrompt}
            <div class="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-semibold text-gray-900">Enhanced Prompt</h2>
                    <button class="px-4 py-2 bg-green-500 text-white border-none rounded-lg cursor-pointer font-semibold transition-colors hover:bg-green-600" on:click={copyToClipboard} title="Copy to clipboard">
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
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                <!-- Explanations -->
                {#if explanations.length > 0}
                    <div class="pt-6 border-t border-gray-100">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Enhancement Details</h3>
                        <ul class="list-none p-0 m-0">
                            {#each explanations as exp}
                                <li class="py-2 pl-6 text-gray-800 relative before:content-['✓'] before:absolute before:left-0 before:text-green-500 before:font-bold">{exp}</li>
                            {/each}
                        </ul>
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</div>
