<script>
  import { onMount, onDestroy } from 'svelte';
  import { mutations, loadMutations, simulateSync } from '../stores/mutations';
  
  let interval;
  
  onMount(() => {
    loadMutations();
    interval = setInterval(loadMutations, 5000);
  });
  
  onDestroy(() => {
    if (interval) clearInterval(interval);
  });
  
  async function handleSync() {
    const count = await simulateSync();
    if (count > 0) {
      alert(`Marked ${count} mutations as synced`);
    } else {
      alert('No unsynced mutations');
    }
  }
  
  $: unsynced = $mutations.filter(m => !m.synced);
  $: synced = $mutations.filter(m => m.synced);
</script>

<aside class="mutation-log">
  <h1>📋 Mutation Log</h1>
  
  <div class="actions">
    <button on:click={() => loadMutations()}>Refresh</button>
    <button on:click={handleSync}>Simulate Sync</button>
  </div>
  
  <div class="stats">
    <strong>Total:</strong> {$mutations.length} | 
    <span class="badge unsynced">{unsynced.length} Unsynced</span>
    <span class="badge synced">{synced.length} Synced</span>
  </div>
  
  <div class="mutation-list">
    {#if $mutations.length === 0}
      <p class="empty">No mutations yet</p>
    {:else}
      {#each $mutations as mut (mut.id)}
        <div class="mutation" class:unsynced={!mut.synced}>
          <div class="mutation-header">
            <span class="operation">{mut.operation}</span>
            <span>{mut.entity_type}</span>
          </div>
          <div class="mutation-meta">
            {new Date(mut.created_at).toLocaleTimeString()}
            {#if mut.synced}
              <span class="badge synced">✓ Synced</span>
            {:else}
              <span class="badge unsynced">⏳ Pending</span>
            {/if}
          </div>
          <div class="mutation-payload">
            {JSON.stringify(mut.payload, null, 2)}
          </div>
        </div>
      {/each}
    {/if}
  </div>
</aside>

<style>
  .mutation-log {
    padding: 20px;
    border-left: 1px solid #ddd;
    background: #f5f5f5;
    overflow-y: auto;
  }
  
  .actions {
    margin-bottom: 10px;
  }
  
  .stats {
    background: white;
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 15px;
    font-size: 13px;
  }
  
  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: bold;
  }
  
  .badge.synced {
    background: #d4edda;
    color: #155724;
  }
  
  .badge.unsynced {
    background: #fff3cd;
    color: #856404;
  }
  
  .mutation {
    margin: 10px 0;
    padding: 10px;
    background: white;
    border-radius: 4px;
    font-size: 12px;
    border-left: 3px solid #28a745;
  }
  
  .mutation.unsynced {
    border-left-color: #ffc107;
  }
  
  .mutation-header {
    display: flex;
    justify-content: space-between;
    font-weight: bold;
    margin-bottom: 5px;
  }
  
  .operation {
    color: #007bff;
    text-transform: uppercase;
  }
  
  .mutation-meta {
    font-size: 11px;
    color: #666;
    margin-bottom: 5px;
  }
  
  .mutation-payload {
    background: #f9f9f9;
    padding: 8px;
    border-radius: 3px;
    margin-top: 5px;
    font-family: 'Courier New', monospace;
    font-size: 11px;
    max-height: 100px;
    overflow-y: auto;
  }
  
  .empty {
    color: #999;
    text-align: center;
    margin-top: 20px;
  }
</style>
