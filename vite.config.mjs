import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
  plugins: [svelte()],
  base: './',
  root: 'src/renderer',
  publicDir: '../../static',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true
  },
  server: {
    port: 5173
  }
});
