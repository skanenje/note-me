<script>
  import { onMount } from 'svelte';
  import { openTabs } from '../stores/aitools.js';
  import { documents, loadDocuments, selectDocument } from '../stores/documents.js';

  export let currentView = "lessons";
  export let onNavigate;

  const navItems = [
    { id: 'lessons',         label: 'Learning Tracks',  icon: 'school' },
    { id: 'documents',       label: 'My Notes',         icon: 'edit_note' },
    { id: 'aitools',         label: 'AI Tools',         icon: 'smart_toy' },
    { id: 'prompt-enhancer', label: 'Prompt Enhancer',  icon: 'auto_fix_high' },
  ];

  onMount(() => {
    loadDocuments();
  });

  function handleCreateNote() {
    onNavigate('documents');
    // Assuming Editor/Sidebar will handle 'New Note' flow, or we trigger it globally
  }
</script>

<aside class="w-sidebar_width h-screen fixed left-0 top-0 border-r border-outline-variant flex flex-col p-md gap-lg bg-background z-20">
  <div class="flex flex-col gap-xs">
    <h1 class="font-h1 text-h1 font-bold text-primary">Note-Me</h1>
    <p class="text-on-surface-variant text-label-caps uppercase tracking-wider opacity-60">Local Workspace</p>
  </div>
  
  <button 
    class="flex items-center justify-center gap-sm bg-primary-container text-on-primary-container font-semibold rounded-lg px-md py-sm transition-transform active:scale-[0.98] hover:bg-opacity-90"
    on:click={handleCreateNote}
  >
    <span class="material-symbols-outlined">add</span>
    <span>New Note</span>
  </button>
  
  <nav class="flex flex-col gap-xs flex-1 overflow-y-auto custom-scrollbar">
    {#each navItems as item}
      <button 
        class="flex items-center gap-sm rounded-lg px-md py-sm transition-colors duration-150 w-full text-left"
        class:bg-secondary-container={currentView === item.id}
        class:text-on-secondary-container={currentView === item.id}
        class:border-l-2={currentView === item.id}
        class:border-primary-container={currentView === item.id}
        class:font-semibold={currentView === item.id}
        class:text-on-surface-variant={currentView !== item.id}
        class:hover:bg-surface-container-high={currentView !== item.id}
        on:click={() => onNavigate(item.id)}
      >
        <span class="material-symbols-outlined">{item.icon}</span>
        <span class="flex-1">{item.label}</span>
        
        {#if item.id === 'documents' && $documents?.length > 0}
          <span class="text-[10px] font-bold bg-surface-container-high px-1.5 py-0.5 rounded text-on-surface-variant">{$documents.length}</span>
        {:else if item.id === 'aitools' && $openTabs?.length > 0}
          <span class="text-[10px] font-bold bg-surface-container-high px-1.5 py-0.5 rounded text-on-surface-variant">{$openTabs.length}</span>
        {/if}
      </button>
    {/each}

    {#if $documents?.length > 0}
      <div class="mt-lg pt-md border-t border-outline-variant opacity-40">
        <p class="text-label-caps px-md mb-sm">Recents</p>
      </div>
      {#each $documents.slice(0, 5) as doc}
        <button 
          class="flex items-center gap-sm text-on-surface-variant hover:bg-surface-container-high rounded-lg px-md py-sm text-xs truncate w-full text-left"
          on:click={() => { onNavigate('documents'); selectDocument(doc.id); }}
        >
          <span class="material-symbols-outlined text-sm">description</span>
          <span class="truncate">{doc.title || 'Untitled Document'}</span>
        </button>
      {/each}
    {/if}
  </nav>

  <div class="flex flex-col gap-xs mt-auto pt-md border-t border-outline-variant">
    <button class="flex items-center gap-sm text-on-surface-variant hover:bg-surface-container-high rounded-lg px-md py-sm transition-colors duration-150 w-full text-left">
      <span class="material-symbols-outlined">settings</span>
      <span>Settings</span>
    </button>
    <button class="flex items-center gap-sm text-on-surface-variant hover:bg-surface-container-high rounded-lg px-md py-sm transition-colors duration-150 w-full text-left">
      <span class="material-symbols-outlined">help_outline</span>
      <span>Support</span>
    </button>
    <div class="flex items-center gap-sm px-md py-sm mt-sm">
      <div class="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden">
        <img class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMxX8cb4Aiv0AhnP7G33yvJipdkaSq5x9157jZkDSNehVd0BnbXmuIMXyx6pTkZk6m2TNExpAP8zF28eHZ9vh6Uw-CmFpc1U-Dhi2-4dE9Z8pEXB1Fv-Um2no6_dgIg4zUSM8jLZOxzCj_ZEfgSSVLNruzkUQszk3QmzBmspfMbXowd4ISSv0pjo0faFmYRTqFtKY3C4Mb-3HVNFc65TVkcnX4qfUrSTCfb0fjwdous3BB0A6Qwgu4yJ2hvYPeEN2TsYYyIppXBDC3" alt="User Profile"/>
      </div>
      <div class="flex flex-col">
        <span class="text-xs font-semibold">User Profile</span>
        <span class="text-[10px] text-on-surface-variant">Pro Plan</span>
      </div>
    </div>
  </div>
</aside>
