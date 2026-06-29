const fs = require('fs');
const themeVars = JSON.parse(fs.readFileSync('theme-vars.json', 'utf8'));

let css = fs.readFileSync('src/renderer/styles/global.css', 'utf8');

// Insert dark vars into :root
let rootIndex = css.indexOf(':root {') + 7;
css = css.substring(0, rootIndex) + '\n' + themeVars.dark + css.substring(rootIndex);

// Insert light vars into :root[data-theme="light"]
let lightRootIndex = css.indexOf(':root[data-theme="light"] {') + 29;
css = css.substring(0, lightRootIndex) + '\n' + themeVars.light + css.substring(lightRootIndex);

fs.writeFileSync('src/renderer/styles/global.css', css);

let tw = fs.readFileSync('tailwind.config.js', 'utf8');
let colorsStart = tw.indexOf('colors: {') + 9;
let colorsEnd = tw.indexOf('borderRadius: {');
let beforeColors = tw.substring(0, colorsStart);
let afterColors = tw.substring(colorsEnd);

tw = beforeColors + '\n' + themeVars.tailwind + '\n      }, \n      ' + afterColors;
fs.writeFileSync('tailwind.config.js', tw);
