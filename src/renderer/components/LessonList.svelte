<script>
  import { onMount } from 'svelte';
  
  export let onSelectLesson;
  
  let lessons = [];
  let loading = true;
  
  onMount(async () => {
    await loadLessons();
  });
  
  async function loadLessons() {
    loading = true;
    const result = await window.api.getLessons();
    if (result.success) {
      lessons = result.lessons;
    }
    loading = false;
  }
</script>

<div class="p-5">
  <h2 class="text-2xl font-bold mb-5">📚 Learning Tracks</h2>
  
  {#if loading}
    <p class="text-gray-500 text-center mt-10">Loading...</p>
  {:else if lessons.length === 0}
    <p class="text-gray-500 text-center mt-10">No lessons available yet</p>
  {:else}
    {#each lessons as lesson (lesson.id)}
      <button 
        class="w-full text-left p-5 my-2 bg-white border-2 border-gray-200 rounded-lg cursor-pointer transition-all hover:border-blue-500 hover:-translate-y-0.5 hover:shadow-lg relative group"
        on:click={() => onSelectLesson(lesson.id)}
      >
        <h3 class="text-lg font-semibold mb-2 text-gray-800">{lesson.title}</h3>
        <p class="text-sm text-gray-600 leading-relaxed">{lesson.description}</p>
        <span class="absolute right-5 top-1/2 -translate-y-1/2 text-2xl text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
      </button>
    {/each}
  {/if}
</div>
