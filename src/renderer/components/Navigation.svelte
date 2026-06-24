<script>
  import { onMount } from 'svelte';
  import { openTabs } from '../stores/aitools.js';
  import { documents, loadDocuments } from '../stores/documents.js';

  export let currentView = "lessons";
  export let onNavigate;

  const navItems = [
    { id: 'lessons',         label: 'Learning Tracks',  iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />' },
    { id: 'documents',       label: 'My Notes',         iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />', badgeStore: documents },
    { id: 'aitools',         label: 'AI Tools',         iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />', badgeStore: openTabs },
    { id: 'prompt-enhancer', label: 'Prompt Enhancer',  iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />' },
  ];

  onMount(() => {
    // Load documents to ensure count is accurate on startup
    loadDocuments();
  });
</script>

<nav class="nav">
  <!-- Logo -->
  <div class="nav__logo">
    <div class="nav__logo-icon">🎓</div>
    <div>
      <div class="nav__logo-name">Note-Me</div>
      <div class="nav__logo-tagline">Learn AI · Build AI</div>
    </div>
  </div>

  <!-- Divider -->
  <div class="nav__divider"></div>

  <!-- Nav items -->
  <ul class="nav__list">
    {#each navItems as item}
      <li>
        <button
          class="nav__item"
          class:nav__item--active={currentView === item.id}
          on:click={() => onNavigate(item.id)}
          aria-current={currentView === item.id ? 'page' : undefined}
        >
          <span class="nav__item-icon">
            <svg xmlns="http://www.w3.org/2000/svg" style="width: 20px; height: 20px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              {@html item.iconSvg}
            </svg>
          </span>
          <span class="nav__item-label">{item.label}</span>
          {#if item.id === 'documents' && $documents?.length > 0}
            <span class="nav__item-badge">{$documents.length}</span>
          {:else if item.id === 'aitools' && $openTabs?.length > 0}
            <span class="nav__item-badge">{$openTabs.length}</span>
          {/if}
          {#if currentView === item.id}
            <span class="nav__item-indicator"></span>
          {/if}
        </button>
      </li>
    {/each}
  </ul>

  <!-- Footer -->
  <div class="nav__footer">
    <div class="nav__status">
      <span class="nav__status-dot"></span>
      <span>Ready</span>
    </div>
  </div>
</nav>

<style>
  .nav {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--clr-surface);
    border-right: 1px solid var(--clr-border);
    padding: 20px 12px;
    user-select: none;
    position: relative;
    z-index: 10;
  }

  /* Logo */
  .nav__logo {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 10px 16px;
  }

  .nav__logo-icon {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: var(--grad-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    box-shadow: 0 4px 12px var(--clr-accent-glow);
    flex-shrink: 0;
  }

  .nav__logo-name {
    font-weight: 700;
    font-size: 0.95rem;
    color: var(--clr-text-primary);
    letter-spacing: 0.01em;
  }

  .nav__logo-tagline {
    font-size: 0.68rem;
    color: var(--clr-text-muted);
    letter-spacing: 0.03em;
    margin-top: 1px;
  }

  .nav__divider {
    height: 1px;
    background: var(--clr-border);
    margin: 0 4px 16px;
    opacity: 0.6;
  }

  /* Nav list */
  .nav__list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
  }

  .nav__item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 12px;
    border-radius: var(--r-md);
    border: none;
    background: transparent;
    color: var(--clr-text-secondary);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--t-fast);
    text-align: left;
    font-family: inherit;
  }

  .nav__item:hover {
    background: var(--clr-surface2);
    color: var(--clr-text-primary);
  }

  .nav__item--active {
    background: rgba(124, 58, 237, 0.15);
    color: #c4b5fd;
  }

  .nav__item--active:hover {
    background: rgba(124, 58, 237, 0.2);
  }

  .nav__item-icon {
    font-size: 1rem;
    width: 22px;
    text-align: center;
    flex-shrink: 0;
  }

  .nav__item-label {
    flex: 1;
  }

  .nav__item-indicator {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--clr-accent);
    box-shadow: 0 0 8px var(--clr-accent-glow);
    flex-shrink: 0;
  }

  .nav__item-badge {
    background: var(--clr-surface);
    color: var(--clr-text-secondary);
    font-size: 0.7rem;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 12px;
    border: 1px solid var(--clr-border);
    margin-left: auto;
  }

  .nav__item--active .nav__item-badge {
    background: rgba(124, 58, 237, 0.2);
    border-color: rgba(124, 58, 237, 0.4);
    color: #c4b5fd;
  }

  /* Footer */
  .nav__footer {
    padding-top: 12px;
    border-top: 1px solid var(--clr-border);
    margin-top: auto;
  }

  .nav__status {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    font-size: 0.75rem;
    color: var(--clr-text-muted);
  }

  .nav__status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--clr-success);
    box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.5; }
  }
</style>
