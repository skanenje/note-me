<script>
  export let blockId;
  export let initialContent;
  export let language = 'prompt';
  
  let input = initialContent || '';
  let output = '';
  let loading = false;
  let history = [];
  
  async function handleRun() {
    if (!input.trim()) return;
    
    loading = true;
    output = '';
    
    try {
      if (language === 'prompt') {
        const result = await window.api.aiExplain({
          context: '',
          question: input
        });
        
        if (result.success) {
          output = result.response;
        } else {
          output = `Error: ${result.error}`;
        }
      } else {
        const result = await window.api.executeCode({
          code: input,
          language,
          blockId
        });
        
        if (result.success) {
          output = result.output;
        } else {
          output = `Error: ${result.error}`;
        }
      }
    } catch (error) {
      output = `Error: ${error.message}`;
    }
    
    loading = false;
  }
  
  async function loadHistory() {
    const result = await window.api.getCodeHistory(blockId);
    if (result.success) {
      history = result.history;
    }
  }
</script>

<div class="my-8 border-2 border-blue-500 rounded-lg overflow-hidden bg-white">
  <div class="bg-gradient-to-r from-primary to-secondary text-white p-4 flex items-center gap-3">
    <span class="text-2xl">🚀</span>
    <h3 class="flex-1 text-lg font-semibold">Interactive Playground</h3>
    {#if language === 'prompt'}
      <span class="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">AI Prompt</span>
    {:else}
      <span class="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">{language}</span>
    {/if}
  </div>
  
  <div class="p-5">
    <textarea
      bind:value={input}
      placeholder={language === 'prompt' ? 'Type your prompt here...' : 'Write your code here...'}
      rows="6"
      class="w-full font-mono text-sm p-4 border border-gray-300 rounded resize-y"
    ></textarea>
    
    <div class="mt-4 flex gap-2">
      <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50" on:click={handleRun} disabled={loading}>
        {loading ? '⏳ Running...' : '▶ Run'}
      </button>
      <button class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" on:click={loadHistory}>📜 History</button>
    </div>
    
    {#if output}
      <div class="mt-5 bg-gray-50 rounded overflow-hidden">
        <div class="bg-gray-200 px-4 py-2 font-bold text-sm">Output:</div>
        <pre class="p-4 whitespace-pre-wrap break-words leading-relaxed">{output}</pre>
      </div>
    {/if}
    
    {#if history.length > 0}
      <div class="mt-5 pt-5 border-t border-gray-300">
        <h4 class="mb-2 text-sm font-semibold text-gray-600">Previous Runs:</h4>
        {#each history as run (run.id)}
          <div class="my-2 p-2 bg-gray-50 rounded text-xs">
            <small class="text-gray-500">{new Date(run.created_at).toLocaleString()}</small>
            <pre class="my-1 text-xs">{run.input}</pre>
            {#if run.output}
              <pre class="bg-gray-200 p-1 rounded text-xs">{run.output}</pre>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
