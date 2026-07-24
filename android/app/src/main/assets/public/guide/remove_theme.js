const fs = require('fs');

const files = [
  'c:/Users/ubaid/dahr/web/guide/wudu.html',
  'c:/Users/ubaid/dahr/web/guide/salah.html',
  'c:/Users/ubaid/dahr/web/guide/gusl.html'
];

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');

  // 1. Remove CSS
  const cssPattern = /\.tb-theme-btn\s*\{[^}]+\}\s*\.tb-theme-btn\s*svg\s*\{[^}]+\}\s*/g;
  content = content.replace(cssPattern, '');

  // 2. Remove HTML button block
  const htmlPattern = /[ \t]*<div class="tb-right">\s*<button class="tb-theme-btn"[^>]+>\s*<span id="themeIcon"><\/span>\s*<\/button>\s*<\/div>\s*/g;
  content = content.replace(htmlPattern, '');

  // 3. Replace JS block
  const jsPattern = /\/\*\s*── THEME SVG ICONS ──\s*\*\/[\s\S]*?function toggleTheme\(\)\{[\s\S]*?\n\}\s*/;
  const newJs = `// Dark mode listener for if it's set from index
let isDark = window.matchMedia('(prefers-color-scheme:dark)').matches;
try {
  const g = localStorage.getItem('globalTheme');
  if(g) isDark = g === 'dark';
} catch(e){}
if(isDark) document.documentElement.setAttribute('data-theme', 'dark');\n\n`;
  
  content = content.replace(jsPattern, newJs);

  fs.writeFileSync(f, content, 'utf8');
}

console.log("Done editing HTML files.");
