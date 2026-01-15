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
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold my-5">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold my-4 text-gray-700">$1</h2>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-blue-500 font-semibold">$1</strong>')
      .replace(/\n/g, '<br>');
  }
</script>

<div class="max-w-4xl mx-auto py-10 px-5">
  {#if loading}
    <p class="text-center text-gray-500 mt-24">Loading lesson...</p>
  {:else if lesson}
    <header class="mb-10">
      <h1 class="text-4xl font-bold mb-2">{lesson.title}</h1>
      <p class="text-gray-600 text-lg leading-relaxed">{lesson.description}</p>
    </header>
    
    <div>
      {#each lesson.blocks as block (block.id)}
        {#if block.type === 'text'}
          <div class="my-8 leading-loose">
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
    <p class="text-center text-red-500 mt-24">Lesson not found</p>
  {/if}
</div>
