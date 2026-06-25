const fs = require('fs');
const svelte = require('svelte/compiler');
const code = fs.readFileSync('/home/swapo/projects/note-me/src/renderer/components/AIToolsView.svelte', 'utf8');
try {
  svelte.compile(code);
  console.log('SVELTE COMPILE SUCCESS');
} catch(e) {
  console.error('SVELTE COMPILE ERROR:', e.message);
}
