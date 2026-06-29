const fs = require('fs');
const tailwindConfig = fs.readFileSync('tailwind.config.js', 'utf-8');

const colorBlock = tailwindConfig.substring(tailwindConfig.indexOf('colors: {') + 9, tailwindConfig.indexOf('borderRadius: {')).trim();
const lines = colorBlock.split('\n');

const darkVars = [];
const lightVars = [];
const tailwindVars = [];

function invertHex(hex) {
    if (!hex.startsWith('#')) return hex;
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c+c).join('');
    
    let r = parseInt(hex.substring(0,2), 16);
    let g = parseInt(hex.substring(2,4), 16);
    let b = parseInt(hex.substring(4,6), 16);
    
    let isDark = (r*0.299 + g*0.587 + b*0.114) < 128;
    
    if (isDark) {
        return '#' + (255 - r).toString(16).padStart(2, '0') + 
                     (255 - g).toString(16).padStart(2, '0') + 
                     (255 - b).toString(16).padStart(2, '0');
    } else {
        let nr = Math.max(0, 255 - r - 50);
        let ng = Math.max(0, 255 - g - 50);
        let nb = Math.max(0, 255 - b - 50);
        return '#' + nr.toString(16).padStart(2, '0') + 
                     ng.toString(16).padStart(2, '0') + 
                     nb.toString(16).padStart(2, '0');
    }
}

const lightOverrides = {
    'background': '#f8fafc',
    'surface': '#ffffff',
    'surface-dim': '#e2e8f0',
    'surface-bright': '#ffffff',
    'surface-container-lowest': '#ffffff',
    'surface-container-low': '#f8fafc',
    'surface-container': '#f1f5f9',
    'surface-container-high': '#e2e8f0',
    'surface-container-highest': '#cbd5e1',
    'surface-variant': '#e2e8f0',
    'on-surface': '#0f172a',
    'on-surface-variant': '#475569',
    'on-background': '#0f172a',
    'outline': '#94a3b8',
    'outline-variant': '#cbd5e1',
    'primary': '#2563eb',
    'on-primary': '#ffffff',
    'primary-container': '#dbeafe',
    'on-primary-container': '#1e3a8a',
    'secondary': '#3b82f6',
    'on-secondary': '#ffffff',
    'secondary-container': '#bfdbfe',
    'on-secondary-container': '#1d4ed8',
    'tertiary': '#8b5cf6',
    'on-tertiary': '#ffffff',
    'tertiary-container': '#ede9fe',
    'on-tertiary-container': '#5b21b6',
    'error': '#ef4444',
    'on-error': '#ffffff',
    'error-container': '#fee2e2',
    'on-error-container': '#991b1b',
};

lines.forEach(line => {
    let match = line.match(/"([a-zA-Z0-9-]+)":\s*"(#?[A-Za-z0-9]+)"/);
    if (!match) {
        match = line.match(/"([a-zA-Z0-9-]+)":\s*'([^']+)'/);
    }
    if (match) {
        let name = match[1];
        let hex = match[2];
        let varName = '--tw-color-' + name;
        darkVars.push('  ' + varName + ': ' + hex + ';');
        
        let lightHex = lightOverrides[name] || invertHex(hex);
        lightVars.push('  ' + varName + ': ' + lightHex + ';');
        
        tailwindVars.push('        "' + name + '": "var(' + varName + ')",');
    }
});

fs.writeFileSync('theme-vars.json', JSON.stringify({
    dark: darkVars.join('\n'),
    light: lightVars.join('\n'),
    tailwind: tailwindVars.join('\n')
}));
