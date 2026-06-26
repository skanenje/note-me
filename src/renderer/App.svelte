<script>
  console.log('[SVELTE] App.svelte script tag is executing!');
  import { onMount } from "svelte";
  import Navigation from "./components/Navigation.svelte";
  import LessonList from "./components/LessonList.svelte";
  import LessonView from "./components/LessonView.svelte";
  import Sidebar from "./components/Sidebar.svelte";
  import Editor from "./components/Editor.svelte";
  import AIToolsView from "./components/AIToolsView.svelte";
  import PromptEnhancer from "./components/PromptEnhancer.svelte";
  import CommandPalette from "./components/CommandPalette.svelte";
  import Toast from "./components/Toast.svelte";
  import { loadDocuments } from "./stores/documents.js";

  let currentView = "lessons"; // 'lessons', 'documents', 'aitools', 'prompt-enhancer'
  let selectedLessonId = null;
  let transitioning = false;
  let showCommandPalette = false;

  function handleGlobalKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      showCommandPalette = !showCommandPalette;
    }
  }

  function appMounted(node) {
    console.log('[SVELTE] App.svelte DOM element mounted! Loading documents...');
    loadDocuments();
  }

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

<svelte:window on:keydown={handleGlobalKeydown} />

<div class="h-screen w-full flex bg-background text-on-surface font-body-md overflow-hidden" use:appMounted>
  <Navigation {currentView} onNavigate={handleNavigate} />

  <main class="ml-sidebar_width flex-1 flex flex-col h-screen overflow-hidden">
    <!-- Top App Bar -->
    <header class="flex justify-between items-center h-16 px-xl bg-surface border-b border-outline-variant sticky top-0 z-10 shrink-0">
      <div class="flex items-center gap-lg">
        <div class="flex items-center gap-md">
          <a class="text-on-surface-variant hover:text-on-surface transition-colors" href="#">Dashboard</a>
          <a class="text-primary font-bold border-b-2 border-primary pb-1" href="#">Workspace</a>
          <a class="text-on-surface-variant hover:text-on-surface transition-colors" href="#">Shared</a>
        </div>
      </div>
      <div class="flex items-center gap-md">
        <div class="relative group">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none group-focus-within:text-primary transition-colors">search</span>
          <input class="bg-surface-container-low border border-outline-variant rounded-lg pl-10 pr-md py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-64 transition-all" placeholder="Search Workspace..." type="text"/>
        </div>
        <div class="flex items-center gap-sm">
          <button class="p-2 hover:bg-surface-container-high rounded-lg text-on-surface-variant transition-colors">
            <span class="material-symbols-outlined">notifications</span>
          </button>
          <button class="p-2 hover:bg-surface-container-high rounded-lg text-on-surface-variant transition-colors">
            <span class="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Documents layout: Sidebar is ALWAYS mounted so pages load immediately on startup -->
    <div class="documents-layout" class:view-hidden={currentView !== 'documents'}>
      <Sidebar />
      <Editor />
    </div>

    <div class="flex-1 overflow-y-auto bg-surface-container-lowest" class:fading={transitioning} class:view-hidden={currentView === 'documents'}>
      {#if currentView === "lessons"}
        <div class="flex h-full page-enter">
          <LessonList onSelectLesson={handleSelectLesson} {selectedLessonId} />
          <div class="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
            {#if selectedLessonId}
              <LessonView lessonId={selectedLessonId} />
            {:else}
              <div class="flex flex-col items-center justify-center h-full text-on-surface-variant opacity-60">
                <span class="material-symbols-outlined text-6xl mb-4">school</span>
                <p>Select a learning track to begin</p>
              </div>
            {/if}
          </div>
        </div>
      {:else if currentView === "aitools"}
        <div class="page-enter h-full">
          <AIToolsView />
        </div>
      {:else if currentView === "prompt-enhancer"}
        <div class="page-enter h-full">
          <PromptEnhancer />
        </div>
      {/if}
    </div>
  </main>

  <CommandPalette 
    show={showCommandPalette} 
    onClose={() => showCommandPalette = false} 
    onNavigate={handleNavigate} 
    onSelectLesson={handleSelectLesson} 
  />
  <Toast />
</div>

<style>
  .fading {
    opacity: 0;
    transition: opacity 0.08s;
  }

  .documents-layout {
    display: flex;
    height: 100%;
    flex: 1;
    min-height: 0;
  }

  /* Hides an element visually but keeps it mounted in the DOM */
  .view-hidden {
    display: none !important;
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
