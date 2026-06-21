<script>
  import { onMount } from 'svelte';
  import PlaygroundBlock from './PlaygroundBlock.svelte';
  import CodeBlock from './CodeBlock.svelte';

  export let lessonId;

  let lesson = null;
  let loading = true;
  let error = null;
  let progress = {};
  let completedCount = 0;

  onMount(async () => {
    await loadLesson();
    await loadProgress();
  });

  async function loadLesson() {
    loading = true;
    error = null;
    try {
      const result = await window.api.getLessonWithBlocks(lessonId);
      if (result.success) {
        lesson = result.lesson;
      } else {
        error = result.error || 'Lesson not found';
      }
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function loadProgress() {
    try {
      const result = await window.api.getLessonProgress(lessonId);
      if (result.success) {
        const map = {};
        let count = 0;
        for (const p of result.progress) {
          map[p.block_id] = p.status;
          if (p.status === 'completed') count++;
        }
        progress = map;
        completedCount = count;
      }
    } catch (_) {}
  }

  async function markComplete(blockId) {
    try {
      await window.api.updateProgress({ lessonId, blockId, status: 'completed' });
      progress = { ...progress, [blockId]: 'completed' };
      completedCount = Object.values(progress).filter(s => s === 'completed').length;
    } catch (_) {}
  }

  function renderTextBlock(content) {
    return content
      .replace(/^# (.*$)/gim, '<h1 class="text-block-h1">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-block-h2">$1</h2>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-block-strong">$1</strong>')
      .replace(/`(.*?)`/g, '<code class="text-block-code">$1</code>')
      .replace(/\n/g, '<br>');
  }

  $: totalBlocks = lesson?.blocks?.length ?? 0;
  $: progressPct = totalBlocks > 0 ? Math.round((completedCount / totalBlocks) * 100) : 0;
</script>

<div class="lesson-view">
  {#if loading}
    <div class="lesson-view__loading">
      <div class="lesson-skeleton skeleton" style="height:48px; width:60%; margin-bottom:12px;"></div>
      <div class="lesson-skeleton skeleton" style="height:24px; width:80%;"></div>
      <div style="margin-top:32px; display:flex; flex-direction:column; gap:16px;">
        {#each [1,2,3] as _}
          <div class="lesson-skeleton skeleton" style="height:120px;"></div>
        {/each}
      </div>
    </div>

  {:else if error}
    <div class="lesson-view__error">
      <span>⚠️</span>
      <p>{error}</p>
    </div>

  {:else if lesson}
    <!-- Progress bar -->
    {#if totalBlocks > 0}
      <div class="progress-bar-wrap">
        <div class="progress-bar">
          <div class="progress-bar__fill" style="width:{progressPct}%"></div>
        </div>
        <span class="progress-label">{completedCount}/{totalBlocks} completed · {progressPct}%</span>
      </div>
    {/if}

    <div class="lesson-view__content">
      <!-- Header -->
      <header class="lesson-header">
        <h1 class="lesson-header__title">{lesson.title}</h1>
        <p class="lesson-header__desc">{lesson.description}</p>
      </header>

      <!-- Blocks -->
      <div class="lesson-blocks">
        {#each lesson.blocks as block (block.id)}
          <div
            class="lesson-block"
            class:lesson-block--done={progress[block.id] === 'completed'}
          >
            {#if block.type === 'text'}
              <div class="text-block">
                {@html renderTextBlock(block.content)}
              </div>
            {:else if block.type === 'playground'}
              <PlaygroundBlock
                blockId={block.id}
                initialContent={block.content}
                language={block.language}
                on:run={() => markComplete(block.id)}
              />
            {:else if block.type === 'code'}
              <CodeBlock
                blockId={block.id}
                code={block.content}
                language={block.language}
              />
            {/if}

            {#if progress[block.id] !== 'completed'}
              <button
                class="mark-done-btn"
                on:click={() => markComplete(block.id)}
              >
                ✓ Mark complete
              </button>
            {:else}
              <span class="done-badge">✓ Completed</span>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .lesson-view {
    height: 100%;
    overflow-y: auto;
    background: var(--clr-bg);
  }

  .lesson-view__loading {
    padding: 48px 32px;
    max-width: 800px;
    margin: 0 auto;
  }

  .lesson-skeleton { border-radius: var(--r-md); }

  .lesson-view__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 50vh;
    gap: 12px;
    color: #fca5a5;
    font-size: 0.9rem;
  }

  /* Progress bar */
  .progress-bar-wrap {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 32px;
    background: rgba(13, 17, 23, 0.9);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--clr-border);
  }

  .progress-bar {
    flex: 1;
    height: 4px;
    background: var(--clr-surface2);
    border-radius: var(--r-full);
    overflow: hidden;
  }

  .progress-bar__fill {
    height: 100%;
    background: var(--grad-primary);
    border-radius: var(--r-full);
    transition: width 500ms cubic-bezier(0.4,0,0.2,1);
  }

  .progress-label {
    font-size: 0.75rem;
    color: var(--clr-text-muted);
    white-space: nowrap;
    font-weight: 500;
  }

  .lesson-view__content {
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 32px 80px;
  }

  .lesson-header {
    margin-bottom: 40px;
  }

  .lesson-header__title {
    font-size: 2rem;
    font-weight: 800;
    color: var(--clr-text-primary);
    margin-bottom: 10px;
    line-height: 1.2;
  }

  .lesson-header__desc {
    font-size: 1rem;
    color: var(--clr-text-secondary);
    line-height: 1.7;
  }

  .lesson-blocks {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .lesson-block {
    background: var(--clr-surface);
    border: 1px solid var(--clr-border);
    border-radius: var(--r-lg);
    padding: 24px;
    transition: border-color var(--t-fast);
  }

  .lesson-block--done {
    border-color: rgba(16, 185, 129, 0.4);
    background: rgba(16, 185, 129, 0.04);
  }

  /* Text block rendered HTML */
  .text-block { color: var(--clr-text-primary); line-height: 1.8; font-size: 0.95rem; }
  :global(.text-block-h1)     { font-size: 1.6rem; font-weight: 800; margin: 16px 0 8px; color: var(--clr-text-primary); }
  :global(.text-block-h2)     { font-size: 1.25rem; font-weight: 700; margin: 14px 0 6px; color: var(--clr-text-secondary); }
  :global(.text-block-strong) { color: #c4b5fd; font-weight: 700; }
  :global(.text-block-code)   { background: var(--clr-bg); border: 1px solid var(--clr-border); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.85em; color: #7dd3fc; }

  /* Mark complete */
  .mark-done-btn {
    margin-top: 16px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: var(--r-full);
    color: #6ee7b7;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--t-fast);
    font-family: inherit;
  }

  .mark-done-btn:hover {
    background: rgba(16, 185, 129, 0.2);
    border-color: rgba(16, 185, 129, 0.6);
    transform: translateY(-1px);
  }

  .done-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 16px;
    padding: 5px 12px;
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.4);
    border-radius: var(--r-full);
    color: #6ee7b7;
    font-size: 0.8rem;
    font-weight: 600;
  }
</style>
