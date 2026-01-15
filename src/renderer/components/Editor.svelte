<script>
  import { currentDocument, updateDocumentTitle } from "../stores/documents";
  import { loadMutations } from "../stores/mutations";
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
      await loadMutations();
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
      await loadMutations();
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
      await loadMutations();
    }
  }
</script>

<main class="editor">
  {#if !$currentDocument}
    <div class="empty-state">
      <div class="empty-icon">📄</div>
      <h2>No page selected</h2>
      <p class="text-secondary">
        Select a page from the sidebar or create a new one
      </p>
    </div>
  {:else}
    <div class="editor-content">
      <div class="page-header">
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
        >
          {$currentDocument.title}
        </h1>
        <div class="page-meta text-tertiary text-small">
          Last edited {new Date($currentDocument.updated_at).toLocaleString()}
        </div>
      </div>

      <!-- Blocks -->
      <div class="blocks-container">
        {#if $currentDocument.blocks.length === 0}
          <div class="empty-blocks">
            <p class="text-tertiary">Start writing or add a block below...</p>
          </div>
        {:else}
          {#each $currentDocument.blocks as block (block.id)}
            <Block {block} onDelete={handleDeleteBlock} />
          {/each}
        {/if}
      </div>

      <!-- Add Block Section -->
      <div class="add-block-section">
        <div class="add-block-header">
          <span class="text-secondary text-small">Add a block</span>
          <select bind:value={blockType} class="block-type-select">
            <option value="paragraph">Paragraph</option>
            <option value="heading">Heading</option>
            <option value="list">List</option>
          </select>
        </div>
        <textarea
          bind:value={blockContent}
          rows="3"
          placeholder="Type something..."
          on:keydown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              handleCreateBlock();
            }
          }}
        ></textarea>
        <div class="add-block-footer">
          <span class="text-tertiary text-tiny">Press Ctrl+Enter to add</span>
          <button class="primary" on:click={handleCreateBlock}>Add Block</button
          >
        </div>
      </div>
    </div>
  {/if}
</main>

<style>
  .editor {
    height: 100vh;
    overflow-y: auto;
    background: var(--color-bg-secondary);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    padding: var(--spacing-2xl);
  }

  .empty-icon {
    font-size: 64px;
    margin-bottom: var(--spacing-lg);
    opacity: 0.3;
  }

  .empty-state h2 {
    margin-bottom: var(--spacing-sm);
    color: var(--color-text-primary);
  }

  .editor-content {
    max-width: 900px;
    margin: 0 auto;
    padding: var(--spacing-2xl);
  }

  .page-header {
    margin-bottom: var(--spacing-2xl);
  }

  .page-header h1 {
    font-size: 40px;
    font-weight: 700;
    line-height: 1.2;
    outline: none;
    border: none;
    padding: var(--spacing-sm) 0;
    margin: 0 0 var(--spacing-sm) 0;
    min-height: 50px;
    cursor: text;
  }

  .page-header h1:hover {
    background: var(--color-bg-hover);
    border-radius: var(--radius-sm);
  }

  .page-header h1:focus {
    background: var(--color-bg-primary);
  }

  .page-header h1:empty:before {
    content: "Untitled";
    color: var(--color-text-tertiary);
  }

  .page-meta {
    padding-left: var(--spacing-sm);
  }

  .blocks-container {
    margin-bottom: var(--spacing-2xl);
  }

  .empty-blocks {
    padding: var(--spacing-2xl);
    text-align: center;
  }

  .add-block-section {
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--spacing-lg);
    margin-top: var(--spacing-xl);
  }

  .add-block-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
  }

  .block-type-select {
    width: auto;
    font-size: 13px;
    padding: var(--spacing-xs) var(--spacing-sm);
  }

  .add-block-section textarea {
    margin-bottom: var(--spacing-md);
    resize: vertical;
    min-height: 80px;
  }

  .add-block-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
</style>
