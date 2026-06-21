<script>
  import { currentDocument, updateDocumentTitle, refreshCurrentDocument } from "../stores/documents.js";
  import { toast } from "../stores/toast.js";
  import Block from "./Block.svelte";

  let blockType = "paragraph";
  let blockContent = "";
  let titleElement;
  let addingBlock = false;

  const BLOCK_TYPES = [
    { value: 'paragraph', label: '¶  Paragraph' },
    { value: 'heading',   label: 'H  Heading' },
    { value: 'list',      label: '≡  List' },
    { value: 'code',      label: '</> Code' },
  ];

  async function handleSaveTitle() {
    if (!$currentDocument) return;
    const title = titleElement.innerText.trim();
    if (!title) {
      titleElement.innerText = $currentDocument.title;
      toast.error("Title cannot be empty");
      return;
    }
    if (title !== $currentDocument.title) {
      try {
        await updateDocumentTitle($currentDocument.id, title);
        toast.success("Title saved");
      } catch (err) {
        toast.error("Failed to save title: " + err.message);
        titleElement.innerText = $currentDocument.title;
      }
    }
  }

  async function handleCreateBlock() {
    if (!$currentDocument || !blockContent.trim()) return;
    addingBlock = true;
    try {
      const result = await window.api.createBlock({
        documentId: $currentDocument.id,
        type: blockType,
        content: blockContent.trim(),
      });
      if (result.success) {
        blockContent = "";
        await refreshCurrentDocument();
        toast.success("Block added");
      } else {
        toast.error("Failed to add block: " + result.error);
      }
    } catch (err) {
      toast.error("Error: " + err.message);
    } finally {
      addingBlock = false;
    }
  }

  async function handleDeleteBlock(blockId) {
    try {
      const result = await window.api.deleteBlock(blockId);
      if (result.success) {
        await refreshCurrentDocument();
        toast.success("Block deleted");
      } else {
        toast.error("Failed to delete block: " + result.error);
      }
    } catch (err) {
      toast.error("Error: " + err.message);
    }
  }

  async function handleUpdateBlock(blockId, content) {
    try {
      const result = await window.api.updateBlock({ blockId, content });
      if (result.success) {
        await refreshCurrentDocument();
        toast.success("Block saved");
      } else {
        toast.error("Failed to save block: " + result.error);
      }
    } catch (err) {
      toast.error("Error: " + err.message);
    }
  }
</script>

<div class="editor">
  {#if !$currentDocument}
    <div class="editor__empty">
      <div class="editor__empty-icon">📝</div>
      <h2 class="editor__empty-title">No page selected</h2>
      <p class="editor__empty-sub">Pick a page from the sidebar or create a new one</p>
    </div>
  {:else}
    <div class="editor__content">
      <!-- Title -->
      <div class="editor__title-wrap">
        <h1
          bind:this={titleElement}
          contenteditable="true"
          on:blur={handleSaveTitle}
          on:keydown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); titleElement.blur(); }
          }}
          class="editor__title"
          data-placeholder="Untitled"
        >{$currentDocument.title}</h1>
        <div class="editor__meta">
          Last edited {new Date($currentDocument.updated_at).toLocaleString()}
        </div>
      </div>

      <!-- Blocks -->
      <div class="editor__blocks">
        {#if $currentDocument.blocks.length === 0}
          <div class="editor__no-blocks">
            <p>Start adding blocks below ↓</p>
          </div>
        {:else}
          {#each $currentDocument.blocks as block (block.id)}
            <Block
              {block}
              onDelete={handleDeleteBlock}
              onUpdate={handleUpdateBlock}
            />
          {/each}
        {/if}
      </div>

      <!-- Add Block -->
      <div class="add-block">
        <div class="add-block__header">
          <span class="add-block__label">Add Block</span>
          <select bind:value={blockType} class="add-block__type-select">
            {#each BLOCK_TYPES as bt}
              <option value={bt.value}>{bt.label}</option>
            {/each}
          </select>
        </div>
        <textarea
          bind:value={blockContent}
          rows="4"
          placeholder={blockType === 'code' ? '// Write your code here...' : 'Type your content here...'}
          class="add-block__textarea"
          class:add-block__textarea--code={blockType === 'code'}
          on:keydown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              handleCreateBlock();
            }
          }}
        ></textarea>
        <div class="add-block__footer">
          <span class="add-block__hint">Ctrl+Enter to add</span>
          <button
            class="add-block__btn"
            on:click={handleCreateBlock}
            disabled={addingBlock || !blockContent.trim()}
          >
            {addingBlock ? 'Adding…' : '+ Add Block'}
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .editor {
    height: 100%;
    overflow-y: auto;
    background: var(--clr-bg);
  }

  .editor__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 12px;
    text-align: center;
    padding: 40px;
  }

  .editor__empty-icon {
    font-size: 4rem;
    opacity: 0.15;
    line-height: 1;
  }

  .editor__empty-title {
    font-size: 1.3rem;
    font-weight: 600;
    color: var(--clr-text-secondary);
  }

  .editor__empty-sub {
    font-size: 0.9rem;
    color: var(--clr-text-muted);
  }

  .editor__content {
    max-width: 760px;
    margin: 0 auto;
    padding: 40px 32px 80px;
  }

  .editor__title-wrap {
    margin-bottom: 32px;
  }

  .editor__title {
    font-size: 2.2rem;
    font-weight: 800;
    color: var(--clr-text-primary);
    line-height: 1.2;
    outline: none;
    cursor: text;
    border-radius: var(--r-sm);
    padding: 4px 6px;
    margin: 0 -6px;
    transition: background var(--t-fast);
    min-height: 52px;
  }

  .editor__title:focus {
    background: var(--clr-surface);
  }

  .editor__title:empty::before {
    content: attr(data-placeholder);
    color: var(--clr-text-muted);
    pointer-events: none;
  }

  .editor__meta {
    font-size: 0.75rem;
    color: var(--clr-text-muted);
    padding: 6px 6px 0;
    letter-spacing: 0.01em;
  }

  .editor__blocks {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 32px;
  }

  .editor__no-blocks {
    padding: 32px;
    text-align: center;
    color: var(--clr-text-muted);
    font-size: 0.9rem;
    border: 1px dashed var(--clr-border);
    border-radius: var(--r-lg);
  }

  /* Add Block panel */
  .add-block {
    background: var(--clr-surface);
    border: 1px solid var(--clr-border);
    border-radius: var(--r-lg);
    padding: 20px;
    transition: border-color var(--t-fast);
  }

  .add-block:focus-within {
    border-color: var(--clr-accent);
    box-shadow: 0 0 0 3px var(--clr-accent-glow);
  }

  .add-block__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
  }

  .add-block__label {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--clr-text-muted);
  }

  .add-block__type-select {
    padding: 5px 10px;
    font-size: 0.8rem;
    background: var(--clr-surface2);
    border: 1px solid var(--clr-border);
    border-radius: var(--r-sm);
    color: var(--clr-text-secondary);
  }

  .add-block__textarea {
    width: 100%;
    padding: 12px 14px;
    background: var(--clr-surface2);
    border: 1px solid var(--clr-border);
    border-radius: var(--r-md);
    color: var(--clr-text-primary);
    font-size: 0.9rem;
    font-family: inherit;
    line-height: 1.6;
    resize: vertical;
    min-height: 90px;
    outline: none;
    transition: border-color var(--t-fast);
  }

  .add-block__textarea:focus {
    border-color: var(--clr-accent);
  }

  .add-block__textarea--code {
    font-family: 'Fira Code', 'Cascadia Code', monospace;
    font-size: 0.85rem;
    color: #7dd3fc;
  }

  .add-block__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;
  }

  .add-block__hint {
    font-size: 0.72rem;
    color: var(--clr-text-muted);
  }

  .add-block__btn {
    padding: 8px 20px;
    background: var(--grad-primary);
    color: white;
    border: none;
    border-radius: var(--r-md);
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--t-fast);
    font-family: inherit;
  }

  .add-block__btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px var(--clr-accent-glow);
  }

  .add-block__btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
