<script>
  export let block;
  export let onDelete;
</script>

<div class="my-4 p-4 bg-white border-l-4 border-blue-500 rounded shadow-sm">
  <div class="flex justify-between items-center mb-2">
    <span class="font-bold text-gray-600 text-xs uppercase">{block.type} • Position {block.position}</span>
    <button class="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600" on:click={() => onDelete(block.id)}>Delete</button>
  </div>
  <div class="whitespace-pre-wrap leading-relaxed text-gray-800 mb-2">{block.content}</div>
  <small class="text-gray-400 text-xs">ID: {block.id.substring(0, 8)}...</small>
</div>
