<script>
  import { onMount } from 'svelte';
  import PlaygroundBlock from './PlaygroundBlock.svelte';
  import CodeBlock from './CodeBlock.svelte';
  
  export let lessonId;
  
  let lesson = null;
  let loading = true;
  
  onMount(async () => {
    await loadLesson();
  });
  
  async function loadLesson() {
    loading = true;
    const result = await window.api.getLessonWithBlocks(lessonId);
    if (result.success) {
      lesson = result.lesson;
    }
    loading = false;
  }
  
  function renderTextBlock(content) {
    // Simple markdown-like rendering
    return content
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }
</script>

<div class="lesson-view">
  {#if loading}
    <p class="loading">Loading lesson...</p>
  {:else if lesson}
    <header class="lesson-header">
      <h1>{lesson.title}</h1>
      <p class="description">{lesson.description}</p>
    </header>
    
    <div class="lesson-content">
      {#each lesson.blocks as block (block.id)}
        {#if block.type === 'text'}
          <div class="text-block">
            {@html renderTextBlock(block.content)}
          </div>
        {:else if block.type === 'playground'}
          <PlaygroundBlock 
            blockId={block.id}
            initialContent={block.content}
            language={block.language}
          />
        {:else if block.type === 'code'}
          <CodeBlock
            blockId={block.id}
            code={block.content}
            language={block.language}
          />
        {/if}
      {/each}
    </div>
  {:else}
    <p class="error">Lesson not found</p>
  {/if}
</div>

<style>
  .lesson-view {
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 20px;
  }
  
  .loading, .error {
    text-align: center;
    color: #999;
    margin-top: 100px;
  }
  
  .lesson-header {
    margin-bottom: 40px;
  }
  
  .lesson-header h1 {
    font-size: 32px;
    margin-bottom: 10px;
  }
  
  .description {
    color: #666;
    font-size: 16px;
    line-height: 1.6;
  }
  
  .text-block {
    margin: 30px 0;
    line-height: 1.8;
  }
  
  .text-block :global(h1) {
    font-size: 28px;
    margin: 20px 0 10px;
  }
  
  .text-block :global(h2) {
    font-size: 22px;
    margin: 20px 0 10px;
    color: #444;
  }
  
  .text-block :global(strong) {
    color: #007bff;
  }
</style>
