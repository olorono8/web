const fs = require('fs');

const files = [
  'c:/Users/ubaid/dahr/web/guide/wudu.html',
  'c:/Users/ubaid/dahr/web/guide/salah.html',
  'c:/Users/ubaid/dahr/web/guide/gusl.html'
];

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');

  const jsPattern = /\/\*\s*── THEME (SVG )?ICONS ──\s*\*\/[\s\S]*?function toggleTheme\(\)\{[\s\S]*?\n\}\s*/;
  
  const newJs = `// Dark mode listener for if it's set from index
let isDark = window.matchMedia('(prefers-color-scheme:dark)').matches;
try {
  const urlParams = new URLSearchParams(window.location.search);
  const themeParam = urlParams.get('theme');
  if (themeParam) {
    isDark = themeParam === 'dark';
  } else {
    const g = localStorage.getItem('globalTheme');
    if(g) isDark = g === 'dark';
  }
} catch(e){}
document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

window.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'set-theme') {
    document.documentElement.setAttribute('data-theme', e.data.theme);
  }
});\n\n`;

  if (content.match(jsPattern)) {
    content = content.replace(jsPattern, newJs);
    fs.writeFileSync(f, content, 'utf8');
    console.log("Fixed", f);
  } else {
    console.log("Could not match pattern in", f);
  }
}
