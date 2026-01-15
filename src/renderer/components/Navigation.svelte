<script>
  export let currentView = "lessons";
  export let onNavigate;
</script>

<nav
  class="flex flex-col h-screen w-64 bg-gradient-to-b from-primary to-secondary text-white p-5 border-r border-gray-200"
>
  <div class="mb-8">
    <h1 class="text-2xl font-bold mb-1">🎓 Note-Me LMS</h1>
    <p class="text-xs opacity-80">Learn AI, Build AI</p>
  </div>

  <div class="flex flex-col gap-2">
    <button
      class="flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all {currentView ===
      'lessons'
        ? 'bg-white text-primary font-bold'
        : 'bg-white/10 hover:bg-white/20'}"
      on:click={() => onNavigate("lessons")}
    >
      <span class="text-xl">📚</span>
      <span>Learning Tracks</span>
    </button>

    <button
      class="flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all {currentView ===
      'documents'
        ? 'bg-white text-primary font-bold'
        : 'bg-white/10 hover:bg-white/20'}"
      on:click={() => onNavigate("documents")}
    >
      <span class="text-xl">📝</span>
      <span>My Notes</span>
    </button>

    <button
      class="flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all {currentView ===
      'aitools'
        ? 'bg-white text-primary font-bold'
        : 'bg-white/10 hover:bg-white/20'}"
      on:click={() => onNavigate("aitools")}
    >
      <span class="text-xl">🤖</span>
      <span>AI Tools</span>
    </button>

    <button
      class="flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all {currentView ===
      'prompt-enhancer'
        ? 'bg-white text-primary font-bold'
        : 'bg-white/10 hover:bg-white/20'}"
      on:click={() => onNavigate("prompt-enhancer")}
    >
      <span class="text-xl">🚀</span>
      <span>Prompt Enhancer</span>
    </button>
  </div>
</nav>
