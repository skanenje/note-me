const { ipcMain } = require('electron');
const { log } = require('../window');
const vm        = require('vm');
const { spawn } = require('child_process');
const Database  = require('better-sqlite3');

// ─── helpers ───────────────────────────────────────────────────────────────

/** Run code in a child process, capture stdout/stderr, enforce timeout */
function spawnExec(cmd, args, input, timeoutMs = 8000) {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let killed = false;

    const proc = spawn(cmd, args, { shell: false });

    const timer = setTimeout(() => {
      killed = true;
      proc.kill('SIGKILL');
      resolve({ output: '', error: `Execution timed out after ${timeoutMs / 1000}s` });
    }, timeoutMs);

    if (input) {
      proc.stdin.write(input);
      proc.stdin.end();
    }

    proc.stdout.on('data', d => (stdout += d.toString()));
    proc.stderr.on('data', d => (stderr += d.toString()));

    proc.on('close', (code) => {
      if (killed) return;
      clearTimeout(timer);
      if (stderr && !stdout) {
        resolve({ output: '', error: stderr.trim() });
      } else {
        // stdout is the primary output; append stderr as warning if both exist
        const combined = stdout + (stderr ? `\n[stderr]\n${stderr.trim()}` : '');
        resolve({ output: combined.trim(), error: null });
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      resolve({ output: '', error: `Failed to start process: ${err.message}` });
    });
  });
}

/** JavaScript executor — Node vm sandbox */
function execJavaScript(code) {
  const logs = [];
  const sandbox = {
    console: {
      log:   (...a) => logs.push(a.map(x => typeof x === 'object' ? JSON.stringify(x, null, 2) : String(x)).join(' ')),
      error: (...a) => logs.push('ERROR: ' + a.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' ')),
      warn:  (...a) => logs.push('WARN: ' + a.join(' ')),
      table: (data) => {
        if (!Array.isArray(data)) { logs.push(JSON.stringify(data, null, 2)); return; }
        if (data.length === 0)    { logs.push('(empty table)'); return; }
        const keys = Object.keys(data[0]);
        const widths = keys.map(k => Math.max(k.length, ...data.map(r => String(r[k] ?? '').length)));
        const sep = '+' + widths.map(w => '-'.repeat(w + 2)).join('+') + '+';
        const row = r => '|' + keys.map((k,i) => ` ${String(r[k]??'').padEnd(widths[i])} `).join('|') + '|';
        logs.push([sep, row(Object.fromEntries(keys.map(k=>[k,k]))), sep, ...data.map(row), sep].join('\n'));
      },
    },
    Math, JSON, Array, Object, String, Number, Boolean,
    parseInt, parseFloat, isNaN, isFinite,
    setTimeout, clearTimeout,
  };
  vm.createContext(sandbox);
  const result = vm.runInContext(code, sandbox, { timeout: 3000 });
  let output = logs.join('\n');
  if (result !== undefined && logs.length === 0) {
    output = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
  }
  return { output: output || '(no output)', error: null };
}

/** Python executor — python3 via child_process */
async function execPython(code) {
  // Inject a small helper that pretty-prints dicts/lists like a REPL
  const wrapper = `
import sys, json, traceback
try:
${code.split('\n').map(l => '    ' + l).join('\n')}
except Exception as e:
    print(traceback.format_exc(), file=sys.stderr)
`;
  return spawnExec('python3', ['-c', wrapper], null, 8000);
}

/** SQL executor — in-memory better-sqlite3 */
function execSQL(code) {
  let db;
  try {
    db = new Database(':memory:');

    // Split on semicolons, run each statement
    const stmts = code
      .split(';')
      .map(s => s.trim())
      .filter(Boolean);

    let lastSelect = null;
    const outputLines = [];

    for (const stmt of stmts) {
      const upper = stmt.toUpperCase().trimStart();
      if (upper.startsWith('SELECT') || upper.startsWith('WITH') || upper.startsWith('PRAGMA')) {
        lastSelect = db.prepare(stmt).all();
      } else {
        const info = db.prepare(stmt).run();
        outputLines.push(`OK — ${info.changes} row(s) affected`);
      }
    }

    if (lastSelect !== null) {
      if (lastSelect.length === 0) {
        outputLines.push('(no rows returned)');
      } else {
        const keys = Object.keys(lastSelect[0]);
        const widths = keys.map(k =>
          Math.max(k.length, ...lastSelect.map(r => String(r[k] ?? 'NULL').length))
        );
        const sep  = '+' + widths.map(w => '-'.repeat(w + 2)).join('+') + '+';
        const hdr  = '|' + keys.map((k,i) => ` ${k.padEnd(widths[i])} `).join('|') + '|';
        const rows = lastSelect.map(r =>
          '|' + keys.map((k,i) => ` ${String(r[k] ?? 'NULL').padEnd(widths[i])} `).join('|') + '|'
        );
        outputLines.push([sep, hdr, sep, ...rows, sep].join('\n'));
        outputLines.push(`\n${lastSelect.length} row(s)`);
      }
    }

    return { output: outputLines.join('\n') || '(executed — no output)', error: null };
  } catch (err) {
    return { output: '', error: err.message };
  } finally {
    if (db) db.close();
  }
}

/** Bash executor */
async function execBash(code) {
  return spawnExec('bash', ['-c', code], null, 8000);
}

// ─── IPC handler registration ───────────────────────────────────────────────

module.exports = function registerLessonHandlers(dbManager) {
  ipcMain.handle('lessons:get-all', async () => {
    try {
      return { success: true, lessons: dbManager.getAllLessons() };
    } catch (e) {
      log('[IPC] lessons:get-all ERROR: ' + e.message);
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('lessons:get-with-blocks', async (e, lessonId) => {
    try {
      return { success: true, lesson: dbManager.getLessonWithBlocks(lessonId) };
    } catch (e) {
      log('[IPC] lessons:get-with-blocks ERROR: ' + e.message);
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('lessons:update-progress', async (_, { lessonId, blockId, status }) => {
    try {
      dbManager.updateProgress(lessonId, blockId, status);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('lessons:get-progress', async (_, lessonId) => {
    try {
      return { success: true, progress: dbManager.getLessonProgress(lessonId) };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('lessons:execute-code', async (_, { code, language, blockId }) => {
    try {
      let result;
      switch ((language || 'javascript').toLowerCase()) {
        case 'javascript':
        case 'js':
          result = execJavaScript(code);
          break;
        case 'python':
        case 'python3':
        case 'py':
          result = await execPython(code);
          break;
        case 'sql':
        case 'sqlite':
          result = execSQL(code);
          break;
        case 'bash':
        case 'sh':
        case 'shell':
          result = await execBash(code);
          break;
        default:
          return { success: false, error: `Language "${language}" is not supported. Supported: javascript, python, sql, bash` };
      }

      if (result.error) {
        return { success: false, error: result.error };
      }
      return { success: true, output: result.output };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
};
