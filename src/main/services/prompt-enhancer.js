const { spawn } = require('child_process');
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

function findPythonExecutable() {
    // List of common python executable locations
    const pythonPaths = [
        '/usr/bin/python3',
        '/usr/local/bin/python3',
        '/opt/homebrew/bin/python3',
        '/usr/bin/python',
        '/usr/local/bin/python',
        process.env.PYTHON_HOME ? path.join(process.env.PYTHON_HOME, 'bin', 'python3') : null,
        process.env.PYTHON_HOME ? path.join(process.env.PYTHON_HOME, 'bin', 'python') : null,
    ].filter(Boolean);

    for (const pythonPath of pythonPaths) {
        if (fs.existsSync(pythonPath)) {
            try {
                execSync(`${pythonPath} --version`, { stdio: 'ignore', shell: true });
                console.log('[PROMPT_ENHANCER] Found python at:', pythonPath);
                return pythonPath;
            } catch (e) {
                console.log('[PROMPT_ENHANCER] Path check failed:', pythonPath, e.message);
                continue;
            }
        }
    }

    // Fall back to just 'python3' or 'python' and hope it's in PATH
    try {
        execSync('which python3', { stdio: 'ignore', shell: true });
        console.log('[PROMPT_ENHANCER] Found python3 in PATH');
        return 'python3';
    } catch {
        try {
            execSync('which python', { stdio: 'ignore', shell: true });
            console.log('[PROMPT_ENHANCER] Found python in PATH');
            return 'python';
        } catch {
            console.error('[PROMPT_ENHANCER] Python not found anywhere');
            return null;
        }
    }
}

function startPromptEnhancer() {
    const serviceDir = path.join(__dirname, '../../backend-services/prompt-enhancer');
    
    try {
        console.log('[PROMPT_ENHANCER] Starting service from:', serviceDir);
        
        const pythonCmd = findPythonExecutable();
        if (!pythonCmd) {
            console.error('[PROMPT_ENHANCER] Python executable not found');
            return null;
        }
        
        console.log('[PROMPT_ENHANCER] Using Python command:', pythonCmd);
        
        const proc = spawn(pythonCmd, ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8001'], {
            cwd: serviceDir,
            stdio: 'inherit',
            env: {
                ...process.env,
                PYTHONUNBUFFERED: '1'
            }
        });
        
        proc.on('error', (err) => {
            console.error('[PROMPT_ENHANCER] Spawn error:', err.message);
        });
        
        proc.on('exit', (code) => {
            console.log('[PROMPT_ENHANCER] Process exited with code:', code);
        });
        
        console.log('[PROMPT_ENHANCER] Started on http://127.0.0.1:8001');
        return proc;
    } catch (err) {
        console.error('[PROMPT_ENHANCER] Failed to start:', err.message);
        return null;
    }
}

function stopPromptEnhancer(proc) {
    if (proc) {
        try {
            console.log('[PROMPT_ENHANCER] Stopping...');
            proc.kill();
        } catch (err) {
            console.error('[PROMPT_ENHANCER] Error stopping:', err.message);
        }
    }
}

module.exports = {
    startPromptEnhancer,
    stopPromptEnhancer
};
