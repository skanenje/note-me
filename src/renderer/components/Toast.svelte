<script>
  import { toasts, dismissToast } from '../stores/toast.js';

  const ICONS = { success: '✓', error: '✕', info: 'ℹ' };
</script>

{#if $toasts.length > 0}
  <div class="toast-stack" aria-live="polite">
    {#each $toasts as toast (toast.id)}
      <button
        class="toast toast--{toast.type}"
        on:click={() => dismissToast(toast.id)}
      >
        <span class="toast__icon">{ICONS[toast.type]}</span>
        <span class="toast__message">{toast.message}</span>
        <span class="toast__close" aria-label="Dismiss">×</span>
      </button>
    {/each}
  </div>
{/if}

<style>
  .toast-stack {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: none;
  }

  .toast {
    pointer-events: all;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border-radius: 10px;
    border: 1px solid transparent;
    min-width: 260px;
    max-width: 420px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    animation: slideInRight 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
    transition: opacity 200ms, transform 200ms;
  }

  .toast--success {
    background: rgba(16, 185, 129, 0.15);
    border-color: rgba(16, 185, 129, 0.4);
    color: #6ee7b7;
  }

  .toast--error {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.4);
    color: #fca5a5;
  }

  .toast--info {
    background: rgba(124, 58, 237, 0.15);
    border-color: rgba(124, 58, 237, 0.4);
    color: #c4b5fd;
  }

  .toast__icon {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 0.75rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .toast--success .toast__icon { background: rgba(16, 185, 129, 0.3); }
  .toast--error   .toast__icon { background: rgba(239, 68, 68, 0.3); }
  .toast--info    .toast__icon { background: rgba(124, 58, 237, 0.3); }

  .toast__message { flex: 1; line-height: 1.4; }

  .toast__close {
    background: transparent;
    border: none;
    color: inherit;
    font-size: 1.1rem;
    cursor: pointer;
    opacity: 0.6;
    padding: 0 2px;
    line-height: 1;
    flex-shrink: 0;
  }
  .toast__close:hover { opacity: 1; }

  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(24px); }
    to   { opacity: 1; transform: translateX(0); }
  }
</style>
