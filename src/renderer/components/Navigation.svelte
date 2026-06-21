<script>
  export let currentView = "lessons";
  export let onNavigate;

  const navItems = [
    { id: 'lessons',         label: 'Learning Tracks',  icon: '📚' },
    { id: 'documents',       label: 'My Notes',          icon: '📝' },
    { id: 'aitools',         label: 'AI Tools',          icon: '🤖' },
    { id: 'prompt-enhancer', label: 'Prompt Enhancer',   icon: '🚀' },
  ];
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
          <span class="nav__item-icon">{item.icon}</span>
          <span class="nav__item-label">{item.label}</span>
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
