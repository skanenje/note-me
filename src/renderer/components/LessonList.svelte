<script>
  import { onMount } from 'svelte';

  export let onSelectLesson;
  export let selectedLessonId = null; // Passed from parent if we want to highlight active

  let lessons = [];
  let loading = true;
  let error = null;

  function listMounted(node) {
    loadLessons();
  }

  async function loadLessons() {
    loading = true;
    error = null;
    try {
      const result = await window.api.getLessons();
      if (result.success) {
        const loadedLessons = result.lessons;
        const lessonsWithProg = [];
        
        for (const lesson of loadedLessons) {
          const detailsRes = await window.api.getLessonWithBlocks(lesson.id);
          const progRes = await window.api.getLessonProgress(lesson.id);
          
          if (detailsRes.success && progRes.success) {
            const blocks = detailsRes.lesson.blocks;
            const totalBlocks = blocks.length;
            
            const completedCount = progRes.progress.filter(p => p.status === 'completed').length;
            const progressPct = totalBlocks > 0 ? Math.round((completedCount / totalBlocks) * 100) : 0;
            
            lessonsWithProg.push({
              ...lesson,
              totalBlocks,
              completedCount,
              progressPct
            });
          } else {
            lessonsWithProg.push({
              ...lesson,
              totalBlocks: 0,
              completedCount: 0,
              progressPct: 0
            });
          }
        }
        lessons = lessonsWithProg;
      } else {
        error = result.error || 'Failed to load lessons';
      }
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="w-80 h-full border-r border-outline-variant bg-surface-container-lowest flex flex-col" use:listMounted>
  <div class="p-md border-b border-outline-variant">
    <h3 class="font-h2 text-primary flex items-center gap-xs">
      <span class="material-symbols-outlined text-[20px]">school</span>
      Learning Tracks
    </h3>
    
    {#if !loading && !error && lessons.length > 0}
      {@const overallPct = Math.round(lessons.reduce((acc, curr) => acc + curr.progressPct, 0) / lessons.length)}
      <div class="mt-sm bg-surface-container-high h-1.5 rounded-full overflow-hidden">
        <div class="bg-primary h-full transition-all duration-500" style="width: {overallPct}%"></div>
      </div>
      <p class="text-[11px] text-on-surface-variant mt-xs">Overall Progress: {overallPct}%</p>
    {/if}
  </div>

  <div class="flex-1 overflow-y-auto p-sm flex flex-col gap-sm custom-scrollbar">
    {#if loading}
      {#each [1,2,3,4] as _}
        <div class="h-16 bg-surface-container-high animate-pulse rounded-lg opacity-50"></div>
      {/each}
    {:else if error}
      <div class="p-md text-center">
        <span class="material-symbols-outlined text-error mb-2 text-3xl">error_outline</span>
        <p class="text-on-surface-variant text-sm mb-4">{error}</p>
        <button on:click={loadLessons} class="bg-primary text-on-primary px-4 py-2 rounded-lg font-bold text-sm">Retry</button>
      </div>
    {:else if lessons.length === 0}
      <div class="p-md text-center text-on-surface-variant opacity-60">
        <span class="material-symbols-outlined text-3xl mb-2">inbox</span>
        <p class="text-sm">No tracks available</p>
      </div>
    {:else}
      <div class="flex flex-col gap-xs">
        <div class="px-sm py-1 flex items-center justify-between group cursor-pointer">
          <span class="text-[11px] font-bold text-on-surface-variant tracking-wider uppercase">Available Tracks</span>
        </div>
        <div class="flex flex-col gap-1">
          {#each lessons as lesson (lesson.id)}
            <button 
              class="flex flex-col items-start gap-1 px-md py-sm rounded-lg text-left group transition-colors"
              class:bg-primary-container={selectedLessonId === lesson.id}
              class:text-on-primary-container={selectedLessonId === lesson.id}
              class:border={selectedLessonId === lesson.id}
              class:border-primary={selectedLessonId === lesson.id}
              class:border-opacity-20={selectedLessonId === lesson.id}
              class:hover:bg-surface-container-high={selectedLessonId !== lesson.id}
              class:text-on-surface={selectedLessonId !== lesson.id}
              on:click={() => onSelectLesson(lesson.id)}
            >
              <div class="flex items-center gap-sm w-full">
                {#if lesson.progressPct === 100}
                  <span class="material-symbols-outlined text-primary text-[18px]" style="font-variation-settings: 'FILL' 1;">check_circle</span>
                {:else if lesson.progressPct > 0}
                  <span class="material-symbols-outlined text-tertiary text-[18px]">timelapse</span>
                {:else}
                  <span class="material-symbols-outlined text-[18px]">play_circle</span>
                {/if}
                <span class="text-sm font-semibold truncate flex-1">{lesson.title}</span>
              </div>
              {#if lesson.progressPct > 0 && lesson.progressPct < 100}
                <div class="w-full pl-[26px]">
                  <div class="h-1 w-full bg-surface-container-highest rounded-full overflow-hidden mt-1">
                    <div class="h-full bg-primary" style="width: {lesson.progressPct}%"></div>
                  </div>
                </div>
              {/if}
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>
