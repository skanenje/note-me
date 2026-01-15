const { spawn } = require('child_process');
const path = require('path');
const { app } = require('electron');

let backendProcess = null;
const isDev = !app.isPackaged;

function startBackend() {
    const fs = require('fs');
    const backendPath = isDev
        ? path.join(__dirname, '../../backend/target/release/wax-space-server')
        : path.join(process.resourcesPath, 'backend/target/release/wax-space-server');

    console.log('[BACKEND] Starting backend from:', backendPath);
    console.log('[BACKEND] isDev:', isDev);

    // Check if backend exists
    if (!fs.existsSync(backendPath)) {
        console.error('[BACKEND] Backend binary not found at:', backendPath);
        console.error('[BACKEND] Please build the backend first: cd backend && cargo build --release');
        return;
    }

    // Ensure backend file is executable
    try {
        const stats = fs.statSync(backendPath);
        if (!stats.isFile()) {
            console.error('[BACKEND] Backend path is not a file:', backendPath);
            return;
        }

        // Make sure it's executable
        const isExecutable = (stats.mode & 0o111) !== 0;
        if (!isExecutable) {
            console.log('[BACKEND] Making backend executable...');
            fs.chmodSync(backendPath, 0o755);
        }
    } catch (err) {
        console.error('[BACKEND] Failed to prepare backend:', err.message);
        return;
    }

    backendProcess = spawn(backendPath, [], {
        cwd: isDev ? path.dirname(backendPath) : process.resourcesPath,
        stdio: 'inherit'
    });

    backendProcess.on('error', (err) => {
        console.error('[BACKEND] Backend spawn error:', err);
    });

    backendProcess.on('exit', (code) => {
        console.log('[BACKEND] Backend exited with code:', code);
    });

    console.log('[BACKEND] Backend started successfully');
}

function stopBackend() {
    if (backendProcess) {
        console.log('[BACKEND] Stopping backend...');
        backendProcess.kill();
        backendProcess = null;
    }
}

module.exports = {
    startBackend: startBackend,
    stopBackend
};
