<script>
  import { onMount } from "svelte";
  import Sidebar from "./components/Sidebar.svelte";
  import Home from "./components/Home.svelte";
  import Editor from "./components/Editor.svelte";
  import { loadDocuments, currentView } from "./stores/documents";

  onMount(() => {
    loadDocuments();
  });
</script>

<div class="app-container">
  <Sidebar />
  {#if $currentView === "home"}
    <Home />
  {:else}
    <Editor />
  {/if}
</div>
