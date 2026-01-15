<script>
  import { currentDocument, updateDocumentTitle } from '../stores/documents';
  import { loadMutations } from '../stores/mutations';
  import Block from './Block.svelte';
  
  let blockType = 'paragraph';
  let blockContent = '';
  
  async function handleSaveTitle() {
    if (!$currentDocument) return;
    
    const titleEl = document.getElementById('docTitle');
    const title = titleEl.innerText.trim();
    
    if (!title) {
      alert('Title cannot be empty');
      return;
    }
    
    await updateDocumentTitle($currentDocument.id, title);
    await loadMutations();
  }
  
  async function handleCreateBlock() {
    if (!$currentDocument || !blockContent.trim()) return;
    
    const result = await window.api.createBlock({
      documentId: $currentDocument.id,
      type: blockType,
      content: blockContent
    });
    
    if (result.success) {
      blockContent = '';
      const updated = await window.api.getDocumentWithBlocks($currentDocument.id);
      if (updated.success) {
        currentDocument.set(updated.document);
      }
      await loadMutations();
    }
  }
  
  async function handleDeleteBlock(blockId) {
    if (!confirm('Delete this block?')) return;
    
    const result = await window.api.deleteBlock(blockId);
    
    if (result.success) {
      const updated = await window.api.getDocumentWithBlocks($currentDocument.id);
      if (updated.success) {
        currentDocument.set(updated.document);
      }
      await loadMutations();
    }
  }
</script>

<main class="editor">
  {#if !$currentDocument}
    <p class="empty">← Select or create a document</p>
  {:else}
    <div class="title-section">
      <h1 
        id="docTitle" 
        contenteditable="true"
      >{$currentDocument.title}</h1>
      <button on:click={handleSaveTitle}>Save Title</button>
    </div>
    
    <small class="timestamp">Created: {new Date($currentDocument.created_at).toLocaleString()}</small>
    
    <div class="create-block">
      <h2>➕ Add Block</h2>
      <select bind:value={blockType}>
        <option value="paragraph">Paragraph</option>
        <option value="heading">Heading</option>
        <option value="list">List</option>
      </select>
      <textarea 
        bind:value={blockContent}
        rows="3" 
        placeholder="Write something..."
        on:keydown={(e) => e.key === 'Enter' && e.ctrlKey && handleCreateBlock()}
      />
      <button class="primary" on:click={handleCreateBlock}>Add Block</button>
    </div>
    
    <h2>Blocks ({$currentDocument.blocks.length})</h2>
    
    {#if $currentDocument.blocks.length === 0}
      <p class="empty">No blocks yet. Add one above.</p>
    {:else}
      {#each $currentDocument.blocks as block (block.id)}
        <Block {block} onDelete={handleDeleteBlock} />
      {/each}
    {/if}
  {/if}
</main>

<style>
  .editor {
    padding: 20px;
    overflow-y: auto;
    background: white;
  }
  
  .empty {
    color: #999;
    text-align: center;
    margin-top: 100px;
  }
  
  .title-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  
  .title-section h1 {
    flex: 1;
    outline: none;
    border-bottom: 2px solid #eee;
    padding: 10px 0;
    margin: 0;
  }
  
  .timestamp {
    color: #999;
    display: block;
    margin-bottom: 20px;
  }
  
  .create-block {
    background: #f9f9f9;
    padding: 15px;
    border-radius: 4px;
    margin: 20px 0;
    border: 1px solid #ddd;
  }
  
  .create-block h2 {
    margin-top: 0;
  }
</style>
