import { writable } from 'svelte/store';

// Default settings
const DEFAULT_SETTINGS = {
  theme: 'dark',
  userName: 'User Profile',
  userPlan: 'Pro Plan'
};

// Load from localStorage or use defaults
const storedSettings = localStorage.getItem('note-me-settings');
const initialSettings = storedSettings ? JSON.parse(storedSettings) : DEFAULT_SETTINGS;

function createSettingsStore() {
  const { subscribe, set, update } = writable(initialSettings);

  return {
    subscribe,
    updateSetting: (key, value) => {
      update(settings => {
        const newSettings = { ...settings, [key]: value };
        localStorage.setItem('note-me-settings', JSON.stringify(newSettings));
        
        // Apply theme immediately if changed
        if (key === 'theme') {
          document.documentElement.setAttribute('data-theme', value);
        }
        
        return newSettings;
      });
    },
    // Initialize the app with current settings (e.g. apply theme on boot)
    init: () => {
      update(settings => {
        document.documentElement.setAttribute('data-theme', settings.theme || 'dark');
        return settings;
      });
    }
  };
}

export const settings = createSettingsStore();
