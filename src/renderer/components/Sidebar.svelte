<script>
  import { documents, currentDocument, loadDocuments, createDocument, selectDocument } from '../stores/documents';
  import { loadMutations } from '../stores/mutations';
  
  let newTitle = '';
  
  async function handleCreate() {
    if (!newTitle.trim()) return;
    
    try {
      const doc = await createDocument(newTitle);
      newTitle = '';
      await selectDocument(doc.id);
      await loadMutations();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }
  
  async function handleSelect(docId) {
    await selectDocument(docId);
  }
</script>

<aside class="sidebar">
  <h1>📄 Documents</h1>
  
  <div class="create-section">
    <input 
      type="text" 
      bind:value={newTitle}
      placeholder="New document..."
      on:keydown={(e) => e.key === 'Enter' && handleCreate()}
    />
    <button class="primary" on:click={handleCreate}>Create</button>
  </div>
  
  <div class="doc-list">
    {#if $documents.length === 0}
      <p class="empty">No documents</p>
    {:else}
      {#each $documents as doc (doc.id)}
        <div 
          class="doc-item"
          class:active={$currentDocument?.id === doc.id}
          on:click={() => handleSelect(doc.id)}
        >
          <strong>{doc.title}</strong>
          <small>{new Date(doc.updated_at).toLocaleString()}</small>
        </div>
      {/each}
    {/if}
  </div>
</aside>

<style>
  .sidebar {
    padding: 20px;
    border-right: 1px solid #ddd;
    background: #fafafa;
    overflow-y: auto;
  }
  
  .create-section {
    margin-bottom: 20px;
  }
  
  .doc-list {
    margin-top: 15px;
  }
  
  .doc-item {
    padding: 10px;
    margin: 5px 0;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    border: 1px solid #e0e0e0;
    transition: all 0.2s;
  }
  
  .doc-item:hover {
    background: #f0f0f0;
  }
  
  .doc-item.active {
    background: #007bff;
    color: white;
    border-color: #007bff;
  }
  
  .doc-item strong {
    display: block;
    margin-bottom: 4px;
  }
  
  .doc-item small {
    opacity: 0.7;
    font-size: 11px;
  }
  
  .empty {
    color: #999;
    font-size: 13px;
    text-align: center;
    margin-top: 20px;
  }
</style>
