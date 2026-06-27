import { writable } from 'svelte/store';

// Default settings
const DEFAULT_SETTINGS = {
  theme: 'dark',
  userName: 'User Profile',
  userPlan: 'Pro Plan',
  fontSize: 'md',       // 'sm' | 'md' | 'lg'
  editorWidth: 'medium', // 'narrow' | 'medium' | 'full'
  spellcheck: true,
};

// Load from localStorage or use defaults
let storedSettings = {};
try {
  const raw = localStorage.getItem('note-me-settings');
  if (raw) storedSettings = JSON.parse(raw);
} catch {}
const initialSettings = { ...DEFAULT_SETTINGS, ...storedSettings };

/** Apply theme to the document root */
function applyTheme(theme) {
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    document.documentElement.setAttribute('data-theme', theme || 'dark');
  }
}

/** Listen for OS-level theme changes when 'system' is selected */
let _systemMediaQuery = null;
function watchSystemTheme(store) {
  if (_systemMediaQuery) {
    _systemMediaQuery.removeEventListener('change', _systemMediaQuery._handler);
    _systemMediaQuery = null;
  }
  let currentTheme;
  store.subscribe(s => currentTheme = s.theme)();
  if (currentTheme === 'system') {
    _systemMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    _systemMediaQuery._handler = () => applyTheme('system');
    _systemMediaQuery.addEventListener('change', _systemMediaQuery._handler);
  }
}

function createSettingsStore() {
  const { subscribe, set, update } = writable(initialSettings);

  const store = {
    subscribe,
    updateSetting: (key, value) => {
      update(settings => {
        const newSettings = { ...settings, [key]: value };
        localStorage.setItem('note-me-settings', JSON.stringify(newSettings));
        if (key === 'theme') {
          applyTheme(value);
          watchSystemTheme(store);
        }
        return newSettings;
      });
    },
    // Initialize the app with current settings on boot
    init: () => {
      update(settings => {
        applyTheme(settings.theme || 'dark');
        watchSystemTheme(store);
        return settings;
      });
    }
  };

  return store;
}

export const settings = createSettingsStore();
