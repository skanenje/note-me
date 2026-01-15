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

        if (!selectedFramework) {
            error = "Please select a framework";
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
                    framework_id: selectedFramework,
                    explain: showExplanation,
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

<div class="prompt-enhancer-container">
    <div class="header">
        <h1>🚀 Prompt Enhancer</h1>
        <p>Transform your prompts with AI-powered learning frameworks</p>
    </div>

    {#if error}
        <div class="alert alert-error">
            {error}
        </div>
    {/if}

    <div class="content">
        <!-- Input Section -->
        <div class="card input-card">
            <h2>Enter Your Prompt</h2>

            <div class="form-group">
                <label for="framework-select">Learning Framework</label>
                <select bind:value={selectedFramework} id="framework-select">
                    {#each frameworks as fw (fw.id)}
                        <option value={fw.id}>
                            {fw.name} — {fw.description}
                        </option>
                    {/each}
                </select>
            </div>

            <div class="form-group">
                <label for="prompt-input">Your Prompt</label>
                <textarea
                    id="prompt-input"
                    bind:value={prompt}
                    placeholder="Type or paste your prompt here..."
                    disabled={isLoading}
                />
            </div>

            <div class="form-group checkbox">
                <input
                    type="checkbox"
                    id="explain-checkbox"
                    bind:checked={showExplanation}
                    disabled={isLoading}
                />
                <label for="explain-checkbox">Include explanations</label>
            </div>

            <div class="button-group">
                <button
                    class="btn btn-primary"
                    on:click={enhancePrompt}
                    disabled={isLoading || !prompt.trim()}
                >
                    {isLoading ? "Enhancing..." : "Enhance Prompt"}
                </button>
                <button class="btn btn-secondary" on:click={clearAll} disabled={isLoading}>
                    Clear
                </button>
            </div>
        </div>

        <!-- Output Section -->
        {#if enhancedPrompt}
            <div class="card output-card">
                <div class="output-header">
                    <h2>Enhanced Prompt</h2>
                    <button class="btn-icon" on:click={copyToClipboard} title="Copy to clipboard">
                        📋 Copy
                    </button>
                </div>

                <div class="enhanced-content">
                    <p>{enhancedPrompt}</p>
                </div>

                <!-- Quality Metrics -->
                {#if qualityMetrics}
                    <div class="metrics-section">
                        <h3>Quality Metrics</h3>
                        <div class="metrics-grid">
                            <div class="metric">
                                <span class="label">Overall Score</span>
                                <span class="value">{qualityMetrics.overall.toFixed(1)}/10</span>
                                <div class="bar">
                                    <div
                                        class="fill"
                                        style="width: {(qualityMetrics.overall / 10) * 100}%"
                                    />
                                </div>
                            </div>
                            <div class="metric">
                                <span class="label">Clarity</span>
                                <span class="value">{qualityMetrics.clarity.toFixed(1)}/10</span>
                                <div class="bar">
                                    <div
                                        class="fill"
                                        style="width: {(qualityMetrics.clarity / 10) * 100}%"
                                    />
                                </div>
                            </div>
                            <div class="metric">
                                <span class="label">Specificity</span>
                                <span class="value">{qualityMetrics.specificity.toFixed(1)}/10</span>
                                <div class="bar">
                                    <div
                                        class="fill"
                                        style="width: {(qualityMetrics.specificity / 10) * 100}%"
                                    />
                                </div>
                            </div>
                            <div class="metric">
                                <span class="label">Context Richness</span>
                                <span class="value">{qualityMetrics.context_richness.toFixed(1)}/10</span>
                                <div class="bar">
                                    <div
                                        class="fill"
                                        style="width: {(qualityMetrics.context_richness / 10) * 100}%"
                                    />
                                </div>
                            </div>
                            <div class="metric">
                                <span class="label">Actionability</span>
                                <span class="value">{qualityMetrics.actionability.toFixed(1)}/10</span>
                                <div class="bar">
                                    <div
                                        class="fill"
                                        style="width: {(qualityMetrics.actionability / 10) * 100}%"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                {/if}

                <!-- Explanations -->
                {#if explanations.length > 0}
                    <div class="explanations-section">
                        <h3>Enhancement Details</h3>
                        <ul>
                            {#each explanations as exp}
                                <li>{exp}</li>
                            {/each}
                        </ul>
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</div>

<style>
    .prompt-enhancer-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        padding: 2rem;
        overflow-y: auto;
    }

    .header {
        text-align: center;
        margin-bottom: 2rem;
    }

    .header h1 {
        font-size: 2rem;
        font-weight: 700;
        color: #1a202c;
        margin-bottom: 0.5rem;
    }

    .header p {
        font-size: 1rem;
        color: #4a5568;
    }

    .content {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        max-width: 900px;
        margin: 0 auto;
        width: 100%;
    }

    .card {
        background: white;
        border-radius: 12px;
        padding: 2rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        border: 1px solid #e2e8f0;
    }

    .card h2 {
        font-size: 1.3rem;
        font-weight: 600;
        color: #1a202c;
        margin-bottom: 1.5rem;
    }

    .card h3 {
        font-size: 1.1rem;
        font-weight: 600;
        color: #2d3748;
        margin-bottom: 1rem;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        margin-bottom: 1.5rem;
    }

    .form-group label {
        font-weight: 500;
        color: #2d3748;
        margin-bottom: 0.5rem;
        font-size: 0.95rem;
    }

    .form-group select,
    .form-group textarea {
        padding: 0.75rem;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        font-size: 1rem;
        font-family: inherit;
        transition: border-color 0.2s;
    }

    .form-group select:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .form-group textarea {
        min-height: 120px;
        resize: vertical;
    }

    .form-group.checkbox {
        flex-direction: row;
        align-items: center;
        gap: 0.75rem;
    }

    .form-group.checkbox input {
        width: 18px;
        height: 18px;
        cursor: pointer;
    }

    .form-group.checkbox label {
        margin-bottom: 0;
        cursor: pointer;
    }

    .button-group {
        display: flex;
        gap: 1rem;
        margin-top: 2rem;
    }

    .btn {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        flex: 1;
    }

    .btn-primary {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
    }

    .btn-primary:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
    }

    .btn-secondary {
        background: #e2e8f0;
        color: #2d3748;
    }

    .btn-secondary:hover:not(:disabled) {
        background: #cbd5e0;
    }

    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .btn-icon {
        padding: 0.5rem 1rem;
        background: #48bb78;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        transition: background 0.2s;
    }

    .btn-icon:hover {
        background: #38a169;
    }

    .output-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    .enhanced-content {
        background: #f7fafc;
        padding: 1.5rem;
        border-radius: 8px;
        border-left: 4px solid #667eea;
        margin-bottom: 1.5rem;
        white-space: pre-wrap;
        word-wrap: break-word;
        line-height: 1.6;
        color: #2d3748;
    }

    .metrics-section {
        margin-bottom: 2rem;
        padding-top: 1.5rem;
        border-top: 1px solid #e2e8f0;
    }

    .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
    }

    .metric {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .metric .label {
        font-size: 0.9rem;
        font-weight: 500;
        color: #4a5568;
    }

    .metric .value {
        font-size: 1.2rem;
        font-weight: 700;
        color: #667eea;
    }

    .bar {
        height: 6px;
        background: #e2e8f0;
        border-radius: 3px;
        overflow: hidden;
    }

    .bar .fill {
        height: 100%;
        background: linear-gradient(90deg, #667eea, #764ba2);
        border-radius: 3px;
        transition: width 0.3s ease;
    }

    .explanations-section {
        padding-top: 1.5rem;
        border-top: 1px solid #e2e8f0;
    }

    .explanations-section ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .explanations-section li {
        padding: 0.75rem 0;
        padding-left: 1.5rem;
        color: #2d3748;
        position: relative;
    }

    .explanations-section li::before {
        content: "✓";
        position: absolute;
        left: 0;
        color: #48bb78;
        font-weight: bold;
    }

    .alert {
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1rem;
    }

    .alert-error {
        background: #fed7d7;
        color: #c53030;
        border: 1px solid #fc8181;
    }

    @media (max-width: 768px) {
        .prompt-enhancer-container {
            padding: 1rem;
        }

        .header h1 {
            font-size: 1.5rem;
        }

        .card {
            padding: 1.5rem;
        }

        .button-group {
            flex-direction: column;
        }

        .metrics-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
