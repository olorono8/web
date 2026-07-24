const fs = require('fs');

const files = [
  'c:/Users/ubaid/dahr/web/guide/shahada.html',
  'c:/Users/ubaid/dahr/web/guide/wudu.html',
  'c:/Users/ubaid/dahr/web/guide/salah.html',
  'c:/Users/ubaid/dahr/web/guide/gusl.html'
];

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');

  // Replace JS block
  const jsPattern = /\/\/\s*Dark mode listener for if it's set from index[\s\S]*?if\(isDark\) document\.documentElement\.setAttribute\('data-theme', 'dark'\);/g;
  
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
});`;
  
  content = content.replace(jsPattern, newJs);

  fs.writeFileSync(f, content, 'utf8');
}

console.log("Done adding theme sync to HTML files.");
