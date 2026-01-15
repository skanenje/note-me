<script>
  export let block;
  export let onDelete;
</script>

<div class="block">
  <div class="block-header">
    <span class="block-type">{block.type} • Position {block.position}</span>
    <button class="danger" on:click={() => onDelete(block.id)}>Delete</button>
  </div>
  <div class="block-content">{block.content}</div>
  <small class="block-id">ID: {block.id.substring(0, 8)}...</small>
</div>

<style>
  .block {
    margin: 15px 0;
    padding: 15px;
    background: white;
    border-left: 3px solid #007bff;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  
  .block-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  
  .block-type {
    font-weight: bold;
    color: #666;
    font-size: 11px;
    text-transform: uppercase;
  }
  
  .block-content {
    white-space: pre-wrap;
    line-height: 1.6;
    color: #333;
    margin-bottom: 8px;
  }
  
  .block-id {
    color: #999;
    font-size: 11px;
  }
</style>
