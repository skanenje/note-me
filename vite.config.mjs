import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

/**
 * Electron loads the renderer from file://.
 * Vite adds crossorigin="crossorigin" to <script> and <link> tags which
 * breaks module loading from file:// in Chromium (CORS check fails).
 * This plugin strips the crossorigin attribute from the emitted HTML.
 */
function removeElectronCrossorigin() {
  return {
    name: 'remove-electron-crossorigin',
    enforce: 'post',
    transformIndexHtml(html) {
      return html
        .replace(/ crossorigin="crossorigin"/g, '')
        .replace(/ crossorigin/g, '');
    },
  };
}

export default defineConfig({
  plugins: [svelte(), removeElectronCrossorigin()],
  base: './',
  root: 'src/renderer',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
});
