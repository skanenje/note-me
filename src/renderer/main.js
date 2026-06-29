import './styles/global.css';
import App from './App.svelte';

// Force all console logs to go to IPC logs so Vite/Electron can't swallow them
const originalError = console.error;
const originalLog = console.log;
const originalWarn = console.warn;

console.error = function(...args) {
  if (window.api && window.api.log) window.api.log('CONSOLE.ERROR: ' + args.join(' '));
  originalError.apply(console, args);
};

console.log = function(...args) {
  if (window.api && window.api.log) window.api.log('CONSOLE.LOG: ' + args.join(' '));
  originalLog.apply(console, args);
};

console.warn = function(...args) {
  if (window.api && window.api.log) window.api.log('CONSOLE.WARN: ' + args.join(' '));
  originalWarn.apply(console, args);
};

window.onerror = function(msg, url, line, col, error) {
  const errText = 'FATAL RENDERER ERROR: ' + msg + ' at ' + line + ':' + col + '\n' + (error && error.stack ? error.stack : '');
  if (window.api && window.api.log) {
    window.api.log(errText);
  } else {
    console.error(errText);
  }
};
window.addEventListener('unhandledrejection', function(event) {
  if (window.api && window.api.log) {
    window.api.log('UNHANDLED PROMISE REJECTION: ' + event.reason);
  }
});

const app = new App({
  target: document.getElementById('app')
});

export default app;
