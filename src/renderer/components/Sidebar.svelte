<script>
  import {
    documents,
    currentDocument,
    currentView,
    loadDocuments,
    createDocument,
    selectDocument,
    setView,
  } from "../stores/documents";

  let newTitle = "";
  let showNewPageInput = false;
  let pagesExpanded = true;

  async function handleCreate() {
    if (!newTitle.trim()) return;

    try {
      const doc = await createDocument(newTitle);
      newTitle = "";
      showNewPageInput = false;
      await selectDocument(doc.id);
    } catch (error) {
      alert("Error: " + error.message);
    }
  }

  async function handleSelect(docId) {
    await selectDocument(docId);
    setView("editor");
  }

  function handleHomeClick() {
    setView("home");
  }

  function togglePages() {
    pagesExpanded = !pagesExpanded;
  }

  function handleNewPage() {
    showNewPageInput = true;
    setTimeout(() => {
      document.querySelector(".new-page-input")?.focus();
    }, 50);
  }
</script>

<aside class="sidebar">
  <!-- Workspace Header -->
  <div class="workspace-header">
    <div class="workspace-info">
      <div class="workspace-icon">📝</div>
      <div class="workspace-details">
        <div class="workspace-name">Note Me</div>
        <div class="workspace-subtitle text-tertiary text-tiny">Personal</div>
      </div>
    </div>
  </div>

  <!-- Search -->
  <div class="search-container">
    <div class="search-box">
      <span class="search-icon">🔍</span>
      <input type="text" placeholder="Search..." class="search-input" />
    </div>
  </div>

  <!-- Navigation -->
  <nav class="nav-section">
    <button
      class="nav-item"
      class:active={$currentView === "home"}
      on:click={handleHomeClick}
    >
      <span class="nav-icon">🏠</span>
      <span class="nav-label">Home</span>
    </button>

    <button class="nav-item">
      <span class="nav-icon">⭐</span>
      <span class="nav-label">Favorites</span>
    </button>
  </nav>

  <!-- Pages Section -->
  <div class="section">
    <button class="section-header" on:click={togglePages}>
      <span class="chevron" class:expanded={pagesExpanded}>▸</span>
      <span class="section-title">Pages</span>
      <button class="add-button" on:click|stopPropagation={handleNewPage}>
        <span>+</span>
      </button>
    </button>

    {#if pagesExpanded}
      <div class="section-content">
        {#if showNewPageInput}
          <div class="new-page-container">
            <input
              type="text"
              class="new-page-input"
              bind:value={newTitle}
              placeholder="Page title..."
              on:keydown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") {
                  showNewPageInput = false;
                  newTitle = "";
                }
              }}
              on:blur={() => {
                if (!newTitle.trim()) showNewPageInput = false;
              }}
            />
          </div>
        {/if}

        {#if $documents.length === 0}
          <div class="empty-pages">
            <p class="text-tertiary text-small">No pages yet</p>
          </div>
        {:else}
          {#each $documents as doc (doc.id)}
            <button
              class="page-item"
              class:active={$currentDocument?.id === doc.id &&
                $currentView === "editor"}
              on:click={() => handleSelect(doc.id)}
            >
              <span class="page-icon">📄</span>
              <span class="page-title">{doc.title}</span>
            </button>
          {/each}
        {/if}
      </div>
    {/if}
  </div>

  <!-- Settings at bottom -->
  <div class="sidebar-footer">
    <button class="nav-item">
      <span class="nav-icon">⚙️</span>
      <span class="nav-label">Settings</span>
    </button>
  </div>
</aside>

<style>
  .sidebar {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--color-bg-primary);
    border-right: 1px solid var(--color-border);
    overflow: hidden;
  }

  /* Workspace Header */
  .workspace-header {
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--color-border);
  }

  .workspace-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .workspace-info:hover {
    background: var(--color-bg-hover);
  }

  .workspace-icon {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    background: var(--color-bg-tertiary);
    border-radius: var(--radius-sm);
  }

  .workspace-details {
    flex: 1;
    min-width: 0;
  }

  .workspace-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .workspace-subtitle {
    margin-top: 1px;
  }

  /* Search */
  .search-container {
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-xs) var(--spacing-sm);
    background: var(--color-bg-tertiary);
    border-radius: var(--radius-sm);
    transition: background var(--transition-fast);
  }

  .search-box:focus-within {
    background: var(--color-bg-primary);
    box-shadow: 0 0 0 1px var(--color-border);
  }

  .search-icon {
    font-size: 14px;
    opacity: 0.5;
  }

  .search-input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 0;
    font-size: 13px;
    color: var(--color-text-primary);
  }

  .search-input:focus {
    outline: none;
    box-shadow: none;
  }

  /* Navigation */
  .nav-section {
    padding: var(--spacing-sm) var(--spacing-md);
    border-bottom: 1px solid var(--color-border);
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    width: 100%;
    padding: var(--spacing-xs) var(--spacing-sm);
    margin: 2px 0;
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background var(--transition-fast);
    text-align: left;
    font-size: 14px;
    color: var(--color-text-primary);
  }

  .nav-item:hover {
    background: var(--color-bg-hover);
  }

  .nav-item.active {
    background: var(--color-bg-active);
    font-weight: 500;
  }

  .nav-icon {
    font-size: 16px;
    width: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nav-label {
    flex: 1;
  }

  /* Sections */
  .section {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    width: 100%;
    padding: var(--spacing-xs) var(--spacing-sm);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: background var(--transition-fast);
    border-radius: var(--radius-sm);
    margin-bottom: var(--spacing-xs);
  }

  .section-header:hover {
    background: var(--color-bg-hover);
  }

  .section-header:hover .add-button {
    opacity: 1;
  }

  .chevron {
    font-size: 10px;
    color: var(--color-text-tertiary);
    transition: transform var(--transition-fast);
    display: inline-block;
  }

  .chevron.expanded {
    transform: rotate(90deg);
  }

  .section-title {
    flex: 1;
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-secondary);
    text-align: left;
  }

  .add-button {
    opacity: 0;
    width: 20px;
    height: 20px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: 16px;
    color: var(--color-text-tertiary);
    transition: all var(--transition-fast);
  }

  .add-button:hover {
    background: var(--color-bg-active);
    color: var(--color-text-primary);
  }

  .section-content {
    padding-left: var(--spacing-sm);
  }

  /* Pages */
  .page-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    width: 100%;
    padding: var(--spacing-xs) var(--spacing-sm);
    margin: 2px 0;
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background var(--transition-fast);
    text-align: left;
    font-size: 14px;
    color: var(--color-text-primary);
  }

  .page-item:hover {
    background: var(--color-bg-hover);
  }

  .page-item.active {
    background: var(--color-bg-active);
    font-weight: 500;
  }

  .page-icon {
    font-size: 14px;
    width: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.7;
  }

  .page-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .new-page-container {
    margin: var(--spacing-xs) 0;
  }

  .new-page-input {
    width: 100%;
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: 14px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-bg-primary);
  }

  .empty-pages {
    padding: var(--spacing-md) var(--spacing-sm);
    text-align: center;
  }

  /* Footer */
  .sidebar-footer {
    padding: var(--spacing-sm) var(--spacing-md);
    border-top: 1px solid var(--color-border);
  }
</style>
