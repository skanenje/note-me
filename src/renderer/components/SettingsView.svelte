<script>
  import { settings } from '../stores/settings.js';
  import { toast } from '../stores/toast.js';

  let localName = $settings.userName;
  
  function saveProfile() {
    const trimmed = localName.trim() || 'User';
    settings.updateSetting('userName', trimmed);
    localName = trimmed;
    toast.success('Profile saved');
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

      <div class="flex items-center gap-6 pt-4 flex-wrap">
        <!-- Light -->
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

        <!-- Dark -->
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

        <!-- System -->
        <button 
          class="theme-btn" 
          class:active={$settings.theme === 'system'}
          on:click={() => settings.updateSetting('theme', 'system')}
        >
          <div class="theme-preview system-preview">
            <div class="theme-preview-nav"></div>
            <div class="theme-preview-main"></div>
          </div>
          <span class="mt-3 font-medium">System</span>
        </button>
      </div>
    </section>

    <!-- Editor Preferences -->
    <section class="space-y-4 border border-outline-variant rounded-xl p-6 bg-surface">
      <div>
        <h2 class="text-xl font-semibold mb-1">Editor</h2>
        <p class="text-sm text-on-surface-variant">Customize your writing experience.</p>
      </div>

      <div class="pt-2 space-y-6">
        <!-- Font size -->
        <div>
          <label class="block text-sm font-medium mb-3 opacity-80">Font Size</label>
          <div class="flex gap-3">
            {#each [['sm','Small'], ['md','Medium'], ['lg','Large']] as [val, label]}
              <button
                class="pref-chip"
                class:pref-chip--active={$settings.fontSize === val}
                on:click={() => settings.updateSetting('fontSize', val)}
              >{label}</button>
            {/each}
          </div>
        </div>

        <!-- Editor width -->
        <div>
          <label class="block text-sm font-medium mb-3 opacity-80">Content Width</label>
          <div class="flex gap-3">
            {#each [['narrow','Narrow'], ['medium','Medium'], ['full','Full Width']] as [val, label]}
              <button
                class="pref-chip"
                class:pref-chip--active={$settings.editorWidth === val}
                on:click={() => settings.updateSetting('editorWidth', val)}
              >{label}</button>
            {/each}
          </div>
        </div>

        <!-- Spellcheck -->
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium">Spell Check</p>
            <p class="text-xs text-on-surface-variant mt-0.5">Underline spelling mistakes while you type</p>
          </div>
          <button
            class="toggle-btn"
            class:toggle-btn--on={$settings.spellcheck}
            role="switch"
            aria-checked={$settings.spellcheck}
            on:click={() => settings.updateSetting('spellcheck', !$settings.spellcheck)}
          >
            <span class="toggle-btn__thumb"></span>
          </button>
        </div>
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

        <button
          class="mt-2 bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-bold transition-all hover:opacity-90"
          on:click={saveProfile}
        >
          Save Changes
        </button>
      </div>
    </section>

    <!-- About Section -->
    <section class="space-y-4 border border-outline-variant rounded-xl p-6 bg-surface opacity-70">
      <div>
        <h2 class="text-xl font-semibold mb-1">About Note-Me</h2>
      </div>
      <div class="text-sm space-y-2">
        <p>Version: 1.0.0-beta</p>
        <p>An advanced Electron-based workspace with integrated Notion-style block editor and AI tool session management.</p>
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

  .light-preview { background: #f8fafc; }
  .light-preview .theme-preview-nav {
    width: 30%;
    background: #f1f5f9;
    border-right: 1px solid #e2e8f0;
  }
  
  .dark-preview { background: #0b1326; }
  .dark-preview .theme-preview-nav {
    width: 30%;
    background: #111827;
    border-right: 1px solid #374151;
  }

  .system-preview {
    background: linear-gradient(90deg, #f8fafc 50%, #0b1326 50%);
  }
  .system-preview .theme-preview-nav {
    width: 30%;
    background: linear-gradient(180deg, #f1f5f9 50%, #111827 50%);
    border-right: 1px solid #6b7280;
  }

  /* Pref chips */
  .pref-chip {
    padding: 6px 16px;
    border-radius: var(--r-full);
    border: 1px solid var(--clr-border);
    background: var(--clr-surface-container-low, var(--clr-surface));
    color: var(--clr-text-secondary);
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    font-family: inherit;
  }
  .pref-chip:hover { border-color: var(--clr-accent); color: var(--clr-text-primary); }
  .pref-chip--active {
    background: var(--clr-accent);
    border-color: var(--clr-accent);
    color: white;
  }

  /* Toggle switch */
  .toggle-btn {
    width: 48px;
    height: 26px;
    border-radius: 13px;
    border: none;
    background: var(--clr-surface2);
    cursor: pointer;
    position: relative;
    transition: background 0.2s;
    flex-shrink: 0;
  }
  .toggle-btn--on { background: var(--clr-accent); }
  .toggle-btn__thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    transition: transform 0.2s cubic-bezier(0.4,0,0.2,1);
  }
  .toggle-btn--on .toggle-btn__thumb { transform: translateX(22px); }
</style>
