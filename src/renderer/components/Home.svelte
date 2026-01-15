<script>
  import { documents, selectDocument } from '../stores/documents';
  import { onMount } from 'svelte';
  
  let recentDocs = [];
  
  const templates = [
    {
      id: 'blank',
      title: 'Blank Page',
      icon: '📄',
      description: 'Start with an empty page'
    },
    {
      id: 'meeting-notes',
      title: 'Meeting Notes',
      icon: '📝',
      description: 'Capture meeting discussions and action items'
    },
    {
      id: 'project-plan',
      title: 'Project Plan',
      icon: '📋',
      description: 'Organize your project milestones and tasks'
    },
    {
      id: 'daily-journal',
      title: 'Daily Journal',
      icon: '📖',
      description: 'Reflect on your day and thoughts'
    }
  ];
  
  onMount(() => {
    // Get the 4 most recently updated documents
    recentDocs = $documents
      .slice()
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 4);
  });
  
  $: {
    // Update recent docs when documents change
    recentDocs = $documents
      .slice()
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 4);
  }
  
  async function handleDocumentClick(docId) {
    await selectDocument(docId);
  }
  
  function handleTemplateClick(templateId) {
    // TODO: Implement template creation
    console.log('Template clicked:', templateId);
  }
  
  function getTimeAgo(date) {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString();
  }
</script>

<div class="home-container">
  <div class="home-header">
    <h1>Good afternoon</h1>
    <p class="subtitle">Welcome back to your workspace</p>
  </div>
  
  <!-- Recently Visited -->
  <section class="section">
    <div class="section-header">
      <div class="section-title">
        <span class="icon">🕐</span>
        <h2>Recently visited</h2>
      </div>
    </div>
    
    {#if recentDocs.length === 0}
      <div class="empty-state">
        <p>No recent documents</p>
        <p class="text-secondary text-small">Create a new page to get started</p>
      </div>
    {:else}
      <div class="card-grid">
        {#each recentDocs as doc (doc.id)}
          <button class="card document-card" on:click={() => handleDocumentClick(doc.id)}>
            <div class="card-icon">📄</div>
            <div class="card-content">
              <h3 class="card-title">{doc.title}</h3>
              <p class="card-meta text-secondary text-small">{getTimeAgo(doc.updated_at)}</p>
            </div>
          </button>
        {/each}
      </div>
    {/if}
  </section>
  
  <!-- Templates -->
  <section class="section">
    <div class="section-header">
      <div class="section-title">
        <span class="icon">✨</span>
        <h2>Start with a template</h2>
      </div>
    </div>
    
    <div class="card-grid">
      {#each templates as template (template.id)}
        <button class="card template-card" on:click={() => handleTemplateClick(template.id)}>
          <div class="card-icon">{template.icon}</div>
          <div class="card-content">
            <h3 class="card-title">{template.title}</h3>
            <p class="card-description text-secondary text-small">{template.description}</p>
          </div>
        </button>
      {/each}
    </div>
  </section>
</div>

<style>
  .home-container {
    padding: var(--spacing-2xl);
    max-width: 1200px;
    margin: 0 auto;
    overflow-y: auto;
    height: 100vh;
    background: var(--color-bg-secondary);
  }
  
  .home-header {
    margin-bottom: var(--spacing-2xl);
  }
  
  .home-header h1 {
    font-size: 40px;
    font-weight: 700;
    margin-bottom: var(--spacing-sm);
  }
  
  .subtitle {
    font-size: 16px;
    color: var(--color-text-secondary);
  }
  
  .section {
    margin-bottom: var(--spacing-2xl);
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
  }
  
  .section-title {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }
  
  .section-title .icon {
    font-size: 18px;
  }
  
  .section-title h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }
  
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--spacing-lg);
  }
  
  .card {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-md);
    padding: var(--spacing-lg);
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    text-align: left;
    cursor: pointer;
    transition: all var(--transition-base);
    box-shadow: var(--shadow-sm);
  }
  
  .card:hover {
    border-color: var(--color-border-hover);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }
  
  .card:active {
    transform: translateY(0);
  }
  
  .card-icon {
    font-size: 32px;
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg-tertiary);
    border-radius: var(--radius-sm);
  }
  
  .card-content {
    flex: 1;
    min-width: 0;
  }
  
  .card-title {
    font-size: 15px;
    font-weight: 600;
    margin: 0 0 var(--spacing-xs) 0;
    color: var(--color-text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .card-meta {
    margin: 0;
  }
  
  .card-description {
    margin: 0;
    line-height: 1.4;
  }
  
  .template-card .card-icon {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
  
  .empty-state {
    text-align: center;
    padding: var(--spacing-2xl);
    background: var(--color-bg-primary);
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-md);
  }
  
  .empty-state p:first-child {
    color: var(--color-text-primary);
    font-weight: 500;
    margin-bottom: var(--spacing-xs);
  }
</style>
