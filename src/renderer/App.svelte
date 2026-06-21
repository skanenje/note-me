<script>
  import { onMount } from "svelte";
  import Navigation from "./components/Navigation.svelte";
  import LessonList from "./components/LessonList.svelte";
  import LessonView from "./components/LessonView.svelte";
  import Sidebar from "./components/Sidebar.svelte";
  import Editor from "./components/Editor.svelte";
  import AIToolsView from "./components/AIToolsView.svelte";
  import PromptEnhancer from "./components/PromptEnhancer.svelte";
  import Toast from "./components/Toast.svelte";
  import { loadDocuments } from "./stores/documents.js";

  let currentView = "lessons"; // 'lessons', 'documents', 'aitools', 'prompt-enhancer'
  let selectedLessonId = null;
  let transitioning = false;

  onMount(() => {
    loadDocuments();
  });

  async function handleNavigate(view) {
    if (view === currentView) return;
    transitioning = true;
    await new Promise(r => setTimeout(r, 80));
    currentView = view;
    selectedLessonId = null;
    transitioning = false;
  }

  function handleSelectLesson(lessonId) {
    selectedLessonId = lessonId;
  }

  function handleBackToLessons() {
    selectedLessonId = null;
  }
</script>

<div class="app-shell">
  <Navigation {currentView} onNavigate={handleNavigate} />

  <main class="main-content" class:fading={transitioning}>
    {#if currentView === "lessons"}
      <div class="page-enter">
        {#if selectedLessonId}
          <div class="lesson-back-wrap">
            <button class="back-btn" on:click={handleBackToLessons}>
              <span class="back-icon">←</span>
              Back to Lessons
            </button>
            <LessonView lessonId={selectedLessonId} />
          </div>
        {:else}
          <LessonList onSelectLesson={handleSelectLesson} />
        {/if}
      </div>
    {:else if currentView === "documents"}
      <div class="documents-layout page-enter">
        <Sidebar />
        <Editor />
      </div>
    {:else if currentView === "aitools"}
      <div class="page-enter" style="height:100%">
        <AIToolsView />
      </div>
    {:else if currentView === "prompt-enhancer"}
      <div class="page-enter" style="height:100%">
        <PromptEnhancer />
      </div>
    {/if}
  </main>

  <Toast />
</div>

<style>
  .app-shell {
    display: grid;
    grid-template-columns: 240px 1fr;
    height: 100vh;
    background: var(--clr-bg);
    overflow: hidden;
  }

  .main-content {
    overflow-y: auto;
    background: var(--clr-bg);
    background-image: var(--grad-glow);
    transition: opacity 80ms ease;
    position: relative;
  }

  .main-content.fading {
    opacity: 0;
  }

  .documents-layout {
    display: grid;
    grid-template-columns: 260px 1fr;
    height: 100%;
  }

  .lesson-back-wrap {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 24px 24px 0;
    padding: 8px 16px;
    background: var(--clr-surface);
    border: 1px solid var(--clr-border);
    border-radius: var(--r-full);
    color: var(--clr-text-secondary);
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--t-fast);
    width: fit-content;
  }

  .back-btn:hover {
    background: var(--clr-surface2);
    color: var(--clr-text-primary);
    border-color: var(--clr-accent);
    transform: translateX(-2px);
  }

  .back-icon {
    font-size: 1rem;
  }
</style>
