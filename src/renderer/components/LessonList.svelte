<script>
  console.log('[SVELTE] LessonList.svelte script tag is executing!');
  import { onMount } from 'svelte';

  export let onSelectLesson;

  let lessons = [];
  let loading = true;
  let error = null;

  const DIFFICULTY_LABELS = { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced' };
  const DIFFICULTY_COLORS = {
    Beginner:     'badge--green',
    Intermediate: 'badge--yellow',
    Advanced:     'badge--red',
  };

  function listMounted(node) {
    console.log('[SVELTE] LessonList.svelte DOM element mounted! Loading lessons...');
    loadLessons();
  }

  async function loadLessons() {
    loading = true;
    error = null;
    try {
      const result = await window.api.getLessons();
      if (result.success) {
        lessons = result.lessons;
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

<div class="lesson-list" use:listMounted>
  <header class="lesson-list__header">
    <h1 class="lesson-list__title">Learning Tracks</h1>
    <p class="lesson-list__sub">Master AI concepts through interactive lessons</p>
  </header>

  {#if loading}
    <div class="cards-grid">
      {#each [1,2,3,4] as _}
        <div class="card-skeleton skeleton"></div>
      {/each}
    </div>

  {:else if error}
    <div class="lesson-list__error">
      <span>⚠️</span>
      <p>{error}</p>
      <button on:click={loadLessons} class="retry-btn">Retry</button>
    </div>

  {:else if lessons.length === 0}
    <div class="lesson-list__empty">
      <div class="lesson-list__empty-icon">📚</div>
      <h2>No lessons available</h2>
      <p>Check back soon for new content</p>
    </div>

  {:else}
    <div class="cards-grid">
      {#each lessons as lesson, i (lesson.id)}
        <button
          class="lesson-card"
          style="animation-delay: {i * 60}ms"
          on:click={() => onSelectLesson(lesson.id)}
        >
          <div class="lesson-card__accent"></div>
          <div class="lesson-card__body">
            <div class="lesson-card__top">
              <div class="lesson-card__icon">📖</div>
              {#if lesson.difficulty}
                {@const label = DIFFICULTY_LABELS[lesson.difficulty] || 'Beginner'}
                <span class="badge {DIFFICULTY_COLORS[label]}">{label}</span>
              {/if}
            </div>
            <h3 class="lesson-card__title">{lesson.title}</h3>
            <p class="lesson-card__desc">{lesson.description}</p>
          </div>
          <div class="lesson-card__footer">
            <span class="lesson-card__cta">Start lesson →</span>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .lesson-list {
    padding: 40px 32px;
    max-width: 1100px;
    margin: 0 auto;
  }

  .lesson-list__header {
    margin-bottom: 32px;
  }

  .lesson-list__title {
    font-size: 1.8rem;
    font-weight: 800;
    color: var(--clr-text-primary);
    background: var(--grad-primary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 6px;
  }

  .lesson-list__sub {
    font-size: 0.95rem;
    color: var(--clr-text-secondary);
  }

  .cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
  }

  .card-skeleton {
    height: 200px;
    border-radius: var(--r-lg);
  }

  /* Lesson card */
  .lesson-card {
    position: relative;
    display: flex;
    flex-direction: column;
    background: var(--clr-surface);
    border: 1px solid var(--clr-border);
    border-radius: var(--r-lg);
    overflow: hidden;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    transition: all var(--t-normal);
    animation: slideUp 400ms cubic-bezier(0.4,0,0.2,1) both;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .lesson-card:hover {
    border-color: var(--clr-accent);
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg), 0 0 30px var(--clr-accent-glow);
  }

  .lesson-card__accent {
    height: 3px;
    background: var(--grad-primary);
    transition: height var(--t-fast);
  }

  .lesson-card:hover .lesson-card__accent {
    height: 4px;
  }

  .lesson-card__body {
    flex: 1;
    padding: 20px;
  }

  .lesson-card__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }

  .lesson-card__icon {
    font-size: 1.5rem;
  }

  .badge {
    font-size: 0.7rem;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: var(--r-full);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .badge--green  { background: rgba(16,185,129,0.15); color: #6ee7b7; border: 1px solid rgba(16,185,129,0.3); }
  .badge--yellow { background: rgba(245,158,11,0.15); color: #fcd34d; border: 1px solid rgba(245,158,11,0.3); }
  .badge--red    { background: rgba(239,68,68,0.15);  color: #fca5a5; border: 1px solid rgba(239,68,68,0.3); }

  .lesson-card__title {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--clr-text-primary);
    margin-bottom: 8px;
    line-height: 1.3;
  }

  .lesson-card__desc {
    font-size: 0.875rem;
    color: var(--clr-text-secondary);
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .lesson-card__footer {
    padding: 14px 20px;
    border-top: 1px solid var(--clr-border);
  }

  .lesson-card__cta {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--clr-text-muted);
    transition: color var(--t-fast);
  }

  .lesson-card:hover .lesson-card__cta {
    color: #c4b5fd;
  }

  /* Error / Empty states */
  .lesson-list__error,
  .lesson-list__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 24px;
    text-align: center;
    gap: 12px;
    color: var(--clr-text-secondary);
  }

  .lesson-list__empty-icon { font-size: 3.5rem; opacity: 0.25; }

  .lesson-list__empty h2,
  .lesson-list__error p {
    font-size: 1rem;
    font-weight: 600;
    color: var(--clr-text-secondary);
  }

  .lesson-list__empty p,
  .lesson-list__error span {
    font-size: 0.875rem;
    color: var(--clr-text-muted);
  }

  .retry-btn {
    margin-top: 8px;
    padding: 8px 20px;
    background: var(--grad-primary);
    color: white;
    border: none;
    border-radius: var(--r-md);
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
  }
</style>
