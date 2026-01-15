<script>
  import { currentDocument, updateDocumentTitle } from "../stores/documents";
  import Block from "./Block.svelte";

  let blockType = "paragraph";
  let blockContent = "";
  let titleElement;

  async function handleSaveTitle() {
    if (!$currentDocument) return;

    const title = titleElement.innerText.trim();

    if (!title) {
      alert("Title cannot be empty");
      titleElement.innerText = $currentDocument.title;
      return;
    }

    if (title !== $currentDocument.title) {
      await updateDocumentTitle($currentDocument.id, title);
    }
  }

  async function handleCreateBlock() {
    if (!$currentDocument || !blockContent.trim()) return;

    const result = await window.api.createBlock({
      documentId: $currentDocument.id,
      type: blockType,
      content: blockContent,
    });

    if (result.success) {
      blockContent = "";
      const updated = await window.api.getDocumentWithBlocks(
        $currentDocument.id,
      );
      if (updated.success) {
        currentDocument.set(updated.document);
      }
    }
  }

  async function handleDeleteBlock(blockId) {
    if (!confirm("Delete this block?")) return;

    const result = await window.api.deleteBlock(blockId);

    if (result.success) {
      const updated = await window.api.getDocumentWithBlocks(
        $currentDocument.id,
      );
      if (updated.success) {
        currentDocument.set(updated.document);
      }
    }
  }
</script>

<main class="h-screen overflow-y-auto bg-gray-50">
  {#if !$currentDocument}
    <div class="flex flex-col items-center justify-center h-full text-center p-8">
      <div class="text-6xl mb-4 opacity-30">📄</div>
      <h2 class="text-xl font-semibold mb-2 text-gray-800">No page selected</h2>
      <p class="text-gray-600">
        Select a page from the sidebar or create a new one
      </p>
    </div>
  {:else}
    <div class="max-w-4xl mx-auto p-8">
      <div class="mb-8">
        <h1
          bind:this={titleElement}
          contenteditable="true"
          on:blur={handleSaveTitle}
          on:keydown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              titleElement.blur();
            }
          }}
          class="text-4xl font-bold leading-tight outline-none border-none py-2 min-h-[50px] cursor-text hover:bg-gray-100 focus:bg-white rounded empty:before:content-['Untitled'] empty:before:text-gray-400"
        >
          {$currentDocument.title}
        </h1>
        <div class="text-sm text-gray-500 pl-2 mt-1">
          Last edited {new Date($currentDocument.updated_at).toLocaleString()}
        </div>
      </div>

      <!-- Blocks -->
      <div class="mb-8">
        {#if $currentDocument.blocks.length === 0}
          <div class="p-8 text-center">
            <p class="text-gray-400">Start writing or add a block below...</p>
          </div>
        {:else}
          {#each $currentDocument.blocks as block (block.id)}
            <Block {block} onDelete={handleDeleteBlock} />
          {/each}
        {/if}
      </div>

      <!-- Add Block Section -->
      <div class="bg-white border border-gray-300 rounded-lg p-4 mt-6">
        <div class="flex justify-between items-center mb-3">
          <span class="text-sm text-gray-600">Add a block</span>
          <select bind:value={blockType} class="text-sm px-2 py-1 border border-gray-300 rounded">
            <option value="paragraph">Paragraph</option>
            <option value="heading">Heading</option>
            <option value="list">List</option>
          </select>
        </div>
        <textarea
          bind:value={blockContent}
          rows="3"
          placeholder="Type something..."
          class="w-full px-3 py-2 border border-gray-300 rounded resize-y min-h-[80px] mb-3"
          on:keydown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              handleCreateBlock();
            }
          }}
        ></textarea>
        <div class="flex justify-between items-center">
          <span class="text-xs text-gray-400">Press Ctrl+Enter to add</span>
          <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" on:click={handleCreateBlock}>Add Block</button>
        </div>
      </div>
    </div>
  {/if}
</main>
