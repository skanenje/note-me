#!/usr/bin/env node
const extract = require('extract-zip');
const path = require('path');
const fs = require('fs');

const zipPath = path.resolve('electron.zip');
const distDir = path.resolve('node_modules/electron/dist');

async function extractElectron() {
    console.log('Extracting using node...');
    if (fs.existsSync(distDir)) {
        fs.rmSync(distDir, { recursive: true, force: true });
    }
    fs.mkdirSync(distDir, { recursive: true });
    
    try {
        await extract(zipPath, { dir: distDir });
        fs.writeFileSync(path.resolve('node_modules/electron/path.txt'), 'electron');
        fs.chmodSync(path.join(distDir, 'electron'), 0o755);
        console.log('Done!');
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

extractElectron();
