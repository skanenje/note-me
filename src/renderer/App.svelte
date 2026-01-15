<script>
  import { onMount } from "svelte";
  import Navigation from "./components/Navigation.svelte";
  import LessonList from "./components/LessonList.svelte";
  import LessonView from "./components/LessonView.svelte";
  import Sidebar from "./components/Sidebar.svelte";
  import Editor from "./components/Editor.svelte";
  import { loadDocuments } from "./stores/documents";

  let currentView = "lessons"; // 'lessons', 'documents'
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

<div class="app-container">
  <Navigation {currentView} onNavigate={handleNavigate} />

  <main class="main-content">
    {#if currentView === "lessons"}
      {#if selectedLessonId}
        <div class="lesson-container">
          <button class="back-button" on:click={handleBackToLessons}>
            ← Back to Lessons
          </button>
          <LessonView lessonId={selectedLessonId} />
        </div>
      {:else}
        <LessonList onSelectLesson={handleSelectLesson} />
      {/if}
    {:else if currentView === "documents"}
      <div class="documents-view">
        <Sidebar />
        <Editor />
      </div>
    {/if}
  </main>
</div>

<style>
  .app-container {
    display: grid;
    grid-template-columns: 250px 1fr;
    height: 100vh;
  }

  .main-content {
    overflow-y: auto;
    background: #f8f9fa;
  }

  .lesson-container {
    padding: 20px;
  }

  .back-button {
    margin-bottom: 20px;
    background: white;
    border: 1px solid #ddd;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
  }

  .back-button:hover {
    background: #f8f9fa;
  }

  .documents-view {
    display: grid;
    grid-template-columns: 280px 1fr;
    height: 100%;
  }
</style>
