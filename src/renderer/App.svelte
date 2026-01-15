<script>
  import { onMount } from "svelte";
  import Navigation from "./components/Navigation.svelte";
  import LessonList from "./components/LessonList.svelte";
  import LessonView from "./components/LessonView.svelte";
  import Sidebar from "./components/Sidebar.svelte";
  import Editor from "./components/Editor.svelte";
  import AIToolsView from "./components/AIToolsView.svelte";
  import PromptEnhancer from "./components/PromptEnhancer.svelte";
  import { loadDocuments } from "./stores/documents";

  let currentView = "lessons"; // 'lessons', 'documents', 'aitools', 'prompt-enhancer'
  let selectedLessonId = null;

  onMount(() => {
    loadDocuments();
  });

  function handleNavigate(view) {
    currentView = view;
    selectedLessonId = null;
  }

  function handleSelectLesson(lessonId) {
    selectedLessonId = lessonId;
  }

  function handleBackToLessons() {
    selectedLessonId = null;
  }
</script>

<div class="grid grid-cols-[250px_1fr] h-screen">
  <Navigation {currentView} onNavigate={handleNavigate} />

  <main class="overflow-y-auto bg-gray-50">
    {#if currentView === "lessons"}
      {#if selectedLessonId}
        <div class="p-5">
          <button
            class="mb-5 bg-white border border-gray-300 px-5 py-2 rounded-md cursor-pointer text-sm hover:bg-gray-50"
            on:click={handleBackToLessons}
          >
            ← Back to Lessons
          </button>
          <LessonView lessonId={selectedLessonId} />
        </div>
      {:else}
        <LessonList onSelectLesson={handleSelectLesson} />
      {/if}
    {:else if currentView === "documents"}
      <div class="grid grid-cols-[280px_1fr] h-full">
        <Sidebar />
        <Editor />
      </div>
    {:else if currentView === "aitools"}
      <AIToolsView />
    {:else if currentView === "prompt-enhancer"}
      <PromptEnhancer />
    {/if}
  </main>
</div>
