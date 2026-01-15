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

<div class="code-block">
  <div class="code-header">
    <span class="language">{language}</span>
    <button on:click={handleRun} disabled={loading}>
      {loading ? '⏳' : '▶'} Run
    </button>
  </div>
  
  <pre class="code-content"><code>{code}</code></pre>
  
  {#if output}
    <div class="code-output">
      <div class="output-label">Output:</div>
      <pre>{output}</pre>
    </div>
  {/if}
</div>

<style>
  .code-block {
    margin: 20px 0;
    border: 1px solid #ddd;
    border-radius: 6px;
    overflow: hidden;
    background: #1e1e1e;
    color: #d4d4d4;
  }
  
  .code-header {
    background: #2d2d2d;
    padding: 10px 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .language {
    font-size: 12px;
    color: #858585;
    text-transform: uppercase;
    font-weight: bold;
  }
  
  .code-header button {
    background: #007bff;
    color: white;
    border: none;
    padding: 5px 12px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
  }
  
  .code-header button:hover {
    background: #0056b3;
  }
  
  .code-content {
    padding: 15px;
    margin: 0;
    overflow-x: auto;
  }
  
  .code-content code {
    font-family: 'Monaco', 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.6;
  }
  
  .code-output {
    background: #252526;
    border-top: 1px solid #3e3e42;
  }
  
  .output-label {
    padding: 8px 15px;
    font-size: 11px;
    color: #858585;
    text-transform: uppercase;
  }
  
  .code-output pre {
    padding: 0 15px 15px;
    margin: 0;
    color: #4ec9b0;
    font-size: 13px;
  }
</style>
