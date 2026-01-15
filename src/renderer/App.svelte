<script>
  import { onMount } from 'svelte';
  import Sidebar from './components/Sidebar.svelte';
  import Editor from './components/Editor.svelte';
  import MutationLog from './components/MutationLog.svelte';
  import { loadDocuments } from './stores/documents';
  
  onMount(() => {
    loadDocuments();
  });
</script>

<div class="app-container">
  <Sidebar />
  <Editor />
  <MutationLog />
</div>

