<script>
  export let blockId;
  export let code;
  export let language = 'javascript';
  
  let output = '';
  let loading = false;
  
  async function handleRun() {
    loading = true;
    output = '';
    
    try {
      const result = await window.api.executeCode({
        code,
        language,
        blockId
      });
      
      if (result.success) {
        output = result.output;
      } else {
        output = `Error: ${result.error}`;
      }
    } catch (error) {
      output = `Error: ${error.message}`;
    }
    
    loading = false;
  }
</script>

<div class="my-5 border border-gray-700 rounded-md overflow-hidden bg-gray-900 text-gray-300">
  <div class="bg-gray-800 px-4 py-2 flex justify-between items-center">
    <span class="text-xs text-gray-500 uppercase font-bold">{language}</span>
    <button 
      on:click={handleRun} 
      disabled={loading}
      class="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 disabled:opacity-50"
    >
      {loading ? '⏳' : '▶'} Run
    </button>
  </div>
  
  <pre class="p-4 overflow-x-auto"><code class="font-mono text-sm leading-relaxed">{code}</code></pre>
  
  {#if output}
    <div class="bg-gray-800 border-t border-gray-700">
      <div class="px-4 py-2 text-xs text-gray-500 uppercase">Output:</div>
      <pre class="px-4 pb-4 text-green-400 text-sm">{output}</pre>
    </div>
  {/if}
</div>
