const { ipcMain, shell, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

module.exports = function registerShellHandlers(dbManager) {
  // Open external URL in the system browser
  ipcMain.handle('shell:open-external', async (_, url) => {
    try {
      await shell.openExternal(url);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Export a document as Markdown — opens a save dialog then writes the file
  ipcMain.handle('shell:export-document', async (_, { documentId }) => {
    try {
      const result = dbManager.getDocumentWithBlocks(documentId);
      if (!result) return { success: false, error: 'Document not found' };

      // Convert blocks → Markdown
      const lines = [];
      lines.push(`# ${result.title}\n`);

      for (const block of result.blocks || []) {
        const indent = '  '.repeat(block.indent || 0);
        const text = (block.content || '')
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]+>/g, ''); // strip HTML tags

        switch (block.type) {
          case 'heading1':   lines.push(`${indent}# ${text}`); break;
          case 'heading2':   lines.push(`${indent}## ${text}`); break;
          case 'heading3':   lines.push(`${indent}### ${text}`); break;
          case 'quote':      lines.push(`${indent}> ${text}`); break;
          case 'bullet':     lines.push(`${indent}- ${text}`); break;
          case 'numbered':   lines.push(`${indent}1. ${text}`); break;
          case 'todo':
            const checked = block.metadata?.checked ? '[x]' : '[ ]';
            lines.push(`${indent}- ${checked} ${text}`);
            break;
          case 'code':       lines.push(`\`\`\`\n${text}\n\`\`\``); break;
          case 'callout':    lines.push(`> 💡 ${text}`); break;
          case 'divider':    lines.push('---'); break;
          default:           if (text.trim()) lines.push(`${indent}${text}`);
        }
        lines.push(''); // blank line between blocks
      }

      const markdown = lines.join('\n');
      const safeTitle = (result.title || 'Untitled').replace(/[^a-z0-9_\-\s]/gi, '').trim();

      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Export as Markdown',
        defaultPath: `${safeTitle}.md`,
        filters: [{ name: 'Markdown', extensions: ['md'] }],
      });

      if (canceled || !filePath) return { success: false, canceled: true };

      fs.writeFileSync(filePath, markdown, 'utf8');
      return { success: true, filePath };
    } catch (err) {
      console.error('[SHELL] export-document error:', err);
      return { success: false, error: err.message };
    }
  });
};
