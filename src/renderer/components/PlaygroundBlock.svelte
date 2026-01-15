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

<div class="playground-block">
  <div class="playground-header">
    <span class="icon">🚀</span>
    <h3>Interactive Playground</h3>
    {#if language === 'prompt'}
      <span class="badge">AI Prompt</span>
    {:else}
      <span class="badge">{language}</span>
    {/if}
  </div>
  
  <div class="playground-content">
    <textarea
      bind:value={input}
      placeholder={language === 'prompt' ? 'Type your prompt here...' : 'Write your code here...'}
      rows="6"
    ></textarea>
    
    <div class="actions">
      <button class="primary" on:click={handleRun} disabled={loading}>
        {loading ? '⏳ Running...' : '▶ Run'}
      </button>
      <button on:click={loadHistory}>📜 History</button>
    </div>
    
    {#if output}
      <div class="output">
        <div class="output-header">Output:</div>
        <pre>{output}</pre>
      </div>
    {/if}
    
    {#if history.length > 0}
      <div class="history">
        <h4>Previous Runs:</h4>
        {#each history as run (run.id)}
          <div class="history-item">
            <small>{new Date(run.created_at).toLocaleString()}</small>
            <pre>{run.input}</pre>
            {#if run.output}
              <pre class="result">{run.output}</pre>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .playground-block {
    margin: 30px 0;
    border: 2px solid #007bff;
    border-radius: 8px;
    overflow: hidden;
    background: white;
  }
  
  .playground-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 15px 20px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .icon {
    font-size: 24px;
  }
  
  .playground-header h3 {
    flex: 1;
    margin: 0;
    font-size: 18px;
  }
  
  .badge {
    background: rgba(255,255,255,0.2);
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: bold;
  }
  
  .playground-content {
    padding: 20px;
  }
  
  textarea {
    width: 100%;
    font-family: 'Monaco', 'Courier New', monospace;
    font-size: 14px;
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 4px;
    resize: vertical;
  }
  
  .actions {
    margin-top: 15px;
    display: flex;
    gap: 10px;
  }
  
  .output {
    margin-top: 20px;
    background: #f8f9fa;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .output-header {
    background: #e9ecef;
    padding: 10px 15px;
    font-weight: bold;
    font-size: 13px;
  }
  
  .output pre {
    padding: 15px;
    margin: 0;
    white-space: pre-wrap;
    word-wrap: break-word;
    line-height: 1.6;
  }
  
  .history {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #ddd;
  }
  
  .history h4 {
    margin-bottom: 10px;
    font-size: 14px;
    color: #666;
  }
  
  .history-item {
    margin: 10px 0;
    padding: 10px;
    background: #f8f9fa;
    border-radius: 4px;
    font-size: 12px;
  }
  
  .history-item small {
    color: #999;
  }
  
  .history-item pre {
    margin: 5px 0;
    font-size: 11px;
  }
  
  .history-item .result {
    background: #e9ecef;
    padding: 5px;
    border-radius: 3px;
  }
</style>
