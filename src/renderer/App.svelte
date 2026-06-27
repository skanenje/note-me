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
  import SettingsView from "./components/SettingsView.svelte";
  import { loadDocuments } from "./stores/documents.js";
  import { settings } from "./stores/settings.js";
  import { toast } from "./stores/toast.js";

  let currentView = "lessons"; // 'lessons', 'documents', 'aitools', 'prompt-enhancer'
  let selectedLessonId = null;
  let transitioning = false;
  let showCommandPalette = false;
  let showNotifications = false;

  function handleGlobalKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      showCommandPalette = !showCommandPalette;
    }
    if (e.key === 'Escape') {
      showNotifications = false;
    }
  }

  function appMounted(node) {
    console.log('[SVELTE] App.svelte DOM element mounted! Loading documents...');
    settings.init();
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

  function handleTopTabClick(tab) {
    toast.info(`"${tab}" view coming soon`);
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
          <!-- Top tabs — coming soon -->
          <button class="text-primary font-bold border-b-2 border-primary pb-1" on:click={() => handleTopTabClick('Workspace')}>Workspace</button>
          <button class="text-on-surface-variant hover:text-on-surface transition-colors" on:click={() => handleTopTabClick('Dashboard')}>Dashboard</button>
          <button class="text-on-surface-variant hover:text-on-surface transition-colors" on:click={() => handleTopTabClick('Shared')}>Shared</button>
        </div>
      </div>
      <div class="flex items-center gap-md">
        <!-- Search: clicking opens CommandPalette -->
        <div class="relative group">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-sm">search</span>
          <input
            class="bg-surface-container-low border border-outline-variant rounded-lg pl-10 pr-md py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-64 transition-all cursor-pointer"
            placeholder="Search Workspace… (Ctrl+K)"
            type="text"
            readonly
            on:click={() => showCommandPalette = true}
            on:focus={() => showCommandPalette = true}
          />
        </div>
        <div class="flex items-center gap-sm relative">
          <!-- Notifications -->
          <button
            class="p-2 hover:bg-surface-container-high rounded-lg text-on-surface-variant transition-colors"
            on:click={() => showNotifications = !showNotifications}
            title="Notifications"
          >
            <span class="material-symbols-outlined">notifications</span>
          </button>
          {#if showNotifications}
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div class="absolute right-0 top-10 w-72 bg-surface border border-outline-variant rounded-xl shadow-2xl z-50 overflow-hidden" on:click|stopPropagation>
              <div class="px-4 py-3 border-b border-outline-variant flex items-center justify-between">
                <span class="text-sm font-semibold">Notifications</span>
                <button class="text-on-surface-variant hover:text-on-surface text-xs" on:click={() => showNotifications = false}>✕</button>
              </div>
              <div class="p-6 text-center text-on-surface-variant opacity-60">
                <span class="material-symbols-outlined text-3xl mb-2">notifications_none</span>
                <p class="text-sm">No new notifications</p>
              </div>
            </div>
          {/if}
          <!-- Account: navigate to settings -->
          <button
            class="p-2 hover:bg-surface-container-high rounded-lg text-on-surface-variant transition-colors"
            on:click={() => handleNavigate('settings')}
            title="Open Settings"
          >
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
      {:else if currentView === "settings"}
        <div class="page-enter h-full">
          <SettingsView />
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

  .page-enter {
    animation: pageEnter 0.15s ease;
  }

  @keyframes pageEnter {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
</style>
