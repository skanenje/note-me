<script>
  import { documents, currentDocument, createDocument, selectDocument } from "../stores/documents";

  let newTitle = "";
  let showInput = false;

  async function handleCreate() {
    if (!newTitle.trim()) return;
    
    try {
      const doc = await createDocument(newTitle);
      newTitle = "";
      showInput = false;
      await selectDocument(doc.id);
    } catch (error) {
      alert("Error: " + error.message);
    }
  }

  async function handleSelect(docId) {
    await selectDocument(docId);
  }
</script>

<aside class="flex flex-col h-full bg-white border-r border-gray-200 p-4">
  <!-- Header -->
  <div class="mb-4">
    <h2 class="text-lg font-bold text-gray-800">📝 My Notes</h2>
  </div>

  <!-- New Page Button -->
  {#if !showInput}
    <button 
      class="w-full px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-100 rounded mb-2"
      on:click={() => showInput = true}
    >
      + New Page
    </button>
  {:else}
    <div class="mb-2">
      <input
        type="text"
        bind:value={newTitle}
        placeholder="Page title..."
        class="w-full px-3 py-2 text-sm border border-gray-300 rounded"
        on:keydown={(e) => {
          if (e.key === "Enter") handleCreate();
          if (e.key === "Escape") { showInput = false; newTitle = ""; }
        }}
        on:blur={() => { if (!newTitle.trim()) showInput = false; }}
        autofocus
      />
    </div>
  {/if}

  <!-- Pages List -->
  <div class="flex-1 overflow-y-auto">
    {#if $documents.length === 0}
      <p class="text-sm text-gray-400 text-center mt-8">No pages yet</p>
    {:else}
      {#each $documents as doc (doc.id)}
        <button
          class="w-full px-3 py-2 text-left text-sm rounded mb-1 transition-colors {$currentDocument?.id === doc.id ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}"
          on:click={() => handleSelect(doc.id)}
        >
          <div class="flex items-center gap-2">
            <span>📄</span>
            <span class="truncate">{doc.title}</span>
          </div>
        </button>
      {/each}
    {/if}
  </div>
</aside>
