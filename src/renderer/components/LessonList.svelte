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

<div class="lesson-list">
  <h2>📚 Learning Tracks</h2>
  
  {#if loading}
    <p class="loading">Loading...</p>
  {:else if lessons.length === 0}
    <p class="empty">No lessons available yet</p>
  {:else}
    {#each lessons as lesson (lesson.id)}
      <button 
        class="lesson-card"
        on:click={() => onSelectLesson(lesson.id)}
      >
        <h3>{lesson.title}</h3>
        <p>{lesson.description}</p>
        <span class="arrow">→</span>
      </button>
    {/each}
  {/if}
</div>

<style>
  .lesson-list {
    padding: 20px;
  }
  
  .lesson-list h2 {
    margin-bottom: 20px;
  }
  
  .loading, .empty {
    color: #999;
    text-align: center;
    margin-top: 40px;
  }
  
  .lesson-card {
    width: 100%;
    text-align: left;
    padding: 20px;
    margin: 10px 0;
    background: white;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
  }
  
  .lesson-card:hover {
    border-color: #007bff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  
  .lesson-card h3 {
    margin: 0 0 8px 0;
    font-size: 18px;
    color: #333;
  }
  
  .lesson-card p {
    margin: 0;
    color: #666;
    font-size: 14px;
    line-height: 1.5;
  }
  
  .arrow {
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 24px;
    color: #007bff;
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  .lesson-card:hover .arrow {
    opacity: 1;
  }
</style>
