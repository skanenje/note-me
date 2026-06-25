<script>
  import {
    documents,
    currentDocument,
    documentsLoading,
    createDocument,
    selectDocument,
    deleteDocument,
  } from "../stores/documents.js";
  import { toast } from "../stores/toast.js";

  let newTitle = "";
  let showInput = false;
  let deletingId = null;
  let inputEl;
  let searchQuery = "";

  $: filteredDocs = $documents.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function handleCreate() {
    if (!newTitle.trim()) return;
    try {
      const doc = await createDocument(newTitle.trim());
      newTitle = "";
      showInput = false;
      await selectDocument(doc.id);
      toast.success("Page created");
    } catch (error) {
      toast.error("Failed to create page: " + error.message);
    }
  }

  async function handleSelect(docId) {
    try {
      await selectDocument(docId);
    } catch (err) {
      toast.error("Failed to open page: " + err.message);
    }
  }

  async function handleDelete(e, docId) {
    e.stopPropagation();
    deletingId = docId;
    try {
      await deleteDocument(docId);
      toast.success("Page deleted");
    } catch (err) {
      toast.error("Failed to delete: " + err.message);
    } finally {
      deletingId = null;
    }
  }

  function handleShowInput() {
    showInput = true;
    setTimeout(() => inputEl?.focus(), 50);
  }
</script>

<aside class="w-80 h-full border-r border-outline-variant bg-surface-container-lowest flex flex-col shrink-0">
  <!-- Header -->
  <div class="p-md border-b border-outline-variant">
    <div class="flex justify-between items-center mb-sm">
      <h3 class="font-h2 text-primary flex items-center gap-xs">
        <span class="material-symbols-outlined text-[20px]">edit_note</span>
        My Notes
      </h3>
      <span class="text-xs font-bold bg-surface-container-high px-2 py-0.5 rounded-full text-on-surface-variant">{$documents.length}</span>
    </div>

    <div class="relative group mt-sm">
      <span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px] pointer-events-none group-focus-within:text-primary transition-colors">search</span>
      <input 
        type="text" 
        bind:value={searchQuery} 
        placeholder="Search notes..." 
        class="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-surface"
      />
    </div>

    <!-- New Page -->
    <div class="mt-sm">
      {#if !showInput}
        <button 
          class="w-full flex items-center justify-center gap-sm border border-dashed border-outline-variant text-on-surface-variant rounded-lg px-3 py-1.5 text-sm hover:border-primary hover:text-primary hover:bg-primary-container hover:bg-opacity-10 transition-all"
          on:click={handleShowInput}
        >
          <span class="material-symbols-outlined text-[18px]">add</span>
          <span>New Page</span>
        </button>
      {:else}
        <div class="flex flex-col gap-1">
          <input
            bind:this={inputEl}
            type="text"
            bind:value={newTitle}
            placeholder="Page title…"
            class="w-full bg-surface-container-high border border-primary rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
            on:keydown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") { showInput = false; newTitle = ""; }
            }}
            on:blur={() => { if (!newTitle.trim()) { showInput = false; } }}
          />
          <div class="text-[10px] text-on-surface-variant px-1">Enter to save · Esc to cancel</div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Documents list -->
  <div class="flex-1 overflow-y-auto p-sm flex flex-col gap-1 custom-scrollbar">
    {#if $documentsLoading}
      {#each [1,2,3] as _}
        <div class="h-10 bg-surface-container-high animate-pulse rounded-lg opacity-50 mb-1"></div>
      {/each}
    {:else if filteredDocs.length === 0}
      <div class="flex flex-col items-center justify-center h-40 text-center opacity-60">
        <span class="material-symbols-outlined text-3xl mb-2">description</span>
        <p class="text-sm font-semibold">No matches found</p>
      </div>
    {:else}
      {#each filteredDocs as doc (doc.id)}
        <button
          class="flex items-center gap-sm px-3 py-2 rounded-lg text-left group transition-colors w-full"
          class:bg-secondary-container={$currentDocument?.id === doc.id}
          class:text-on-secondary-container={$currentDocument?.id === doc.id}
          class:font-semibold={$currentDocument?.id === doc.id}
          class:hover:bg-surface-container-high={$currentDocument?.id !== doc.id}
          class:text-on-surface-variant={$currentDocument?.id !== doc.id}
          on:click={() => handleSelect(doc.id)}
        >
          <span class="material-symbols-outlined text-[18px] shrink-0">description</span>
          <span class="text-sm truncate flex-1">{doc.title || 'Untitled'}</span>
          
          <button
            class="material-symbols-outlined text-[16px] text-on-surface-variant opacity-0 group-hover:opacity-100 hover:text-error hover:bg-error-container rounded p-0.5 transition-all shrink-0"
            aria-label="Delete page"
            on:click={(e) => handleDelete(e, doc.id)}
            disabled={deletingId === doc.id}
          >
            {deletingId === doc.id ? 'pending' : 'delete'}
          </button>
        </button>
      {/each}
    {/if}
  </div>
</aside>
