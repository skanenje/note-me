<script>
  import { settings } from '../stores/settings.js';

  let localName = $settings.userName;
  
  function saveProfile() {
    settings.updateSetting('userName', localName);
  }
</script>

<div class="settings-view h-full w-full overflow-y-auto bg-background p-10 text-on-surface">
  <div class="max-w-3xl mx-auto space-y-12">
    
    <div>
      <h1 class="text-3xl font-bold mb-2">Settings</h1>
      <p class="text-on-surface-variant opacity-80">Manage your workspace preferences and application settings.</p>
    </div>

    <!-- Theme Settings -->
    <section class="space-y-4 border border-outline-variant rounded-xl p-6 bg-surface">
      <div>
        <h2 class="text-xl font-semibold mb-1">Appearance</h2>
        <p class="text-sm text-on-surface-variant">Customize how Note-Me looks on your device.</p>
      </div>

      <div class="flex items-center gap-6 pt-4">
        <button 
          class="theme-btn" 
          class:active={$settings.theme === 'light'}
          on:click={() => settings.updateSetting('theme', 'light')}
        >
          <div class="theme-preview light-preview">
            <div class="theme-preview-nav"></div>
            <div class="theme-preview-main"></div>
          </div>
          <span class="mt-3 font-medium">Light</span>
        </button>

        <button 
          class="theme-btn" 
          class:active={$settings.theme === 'dark'}
          on:click={() => settings.updateSetting('theme', 'dark')}
        >
          <div class="theme-preview dark-preview">
            <div class="theme-preview-nav"></div>
            <div class="theme-preview-main"></div>
          </div>
          <span class="mt-3 font-medium">Dark</span>
        </button>
      </div>
    </section>

    <!-- Profile Settings -->
    <section class="space-y-4 border border-outline-variant rounded-xl p-6 bg-surface">
      <div>
        <h2 class="text-xl font-semibold mb-1">User Profile</h2>
        <p class="text-sm text-on-surface-variant">Your personal information in the app.</p>
      </div>

      <div class="pt-4 max-w-md space-y-4">
        <div>
          <label for="userName" class="block text-sm font-medium mb-1 opacity-80">Display Name</label>
          <input 
            type="text" 
            id="userName"
            bind:value={localName} 
            on:blur={saveProfile}
            on:keydown={(e) => e.key === 'Enter' && saveProfile()}
            class="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-1 opacity-80">Current Plan</label>
          <div class="flex items-center gap-2">
            <span class="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-sm font-semibold">{$settings.userPlan}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- About Section -->
    <section class="space-y-4 border border-outline-variant rounded-xl p-6 bg-surface opacity-70">
      <div>
        <h2 class="text-xl font-semibold mb-1">About Note-Me</h2>
      </div>
      <div class="text-sm space-y-2">
        <p>Version: 1.0.0-beta</p>
        <p>An advanced agentic IDE with integrated Notion-style block editor and AI tool session management.</p>
      </div>
    </section>
  </div>
</div>

<style>
  .theme-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--clr-text-secondary);
    transition: all 0.2s;
  }
  .theme-btn:hover {
    color: var(--clr-text-primary);
  }
  
  .theme-preview {
    width: 140px;
    height: 90px;
    border-radius: var(--r-md);
    border: 2px solid var(--clr-border);
    display: flex;
    overflow: hidden;
    transition: border-color 0.2s, transform 0.2s;
  }
  .theme-btn:hover .theme-preview {
    transform: translateY(-2px);
  }
  .theme-btn.active .theme-preview {
    border-color: var(--clr-accent);
    box-shadow: 0 0 0 2px var(--clr-accent-glow);
  }
  .theme-btn.active {
    color: var(--clr-accent);
  }

  .light-preview {
    background: #f8fafc;
  }
  .light-preview .theme-preview-nav {
    width: 30%;
    background: #f1f5f9;
    border-right: 1px solid #e2e8f0;
  }
  
  .dark-preview {
    background: #0b1326;
  }
  .dark-preview .theme-preview-nav {
    width: 30%;
    background: #111827;
    border-right: 1px solid #374151;
  }
</style>
