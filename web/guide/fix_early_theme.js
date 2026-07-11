const fs = require('fs');

const earlyThemeScript = `<script>
(function(){
  var isDark = window.matchMedia('(prefers-color-scheme:dark)').matches;
  try {
    var p = new URLSearchParams(window.location.search).get('theme');
    if (p) { isDark = p === 'dark'; }
    else { var g = localStorage.getItem('globalTheme'); if(g) isDark = g === 'dark'; }
  } catch(e){}
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
})();
<\/script>`;

const postMessageListener = `
window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'set-theme') {
    document.documentElement.setAttribute('data-theme', e.data.theme);
  }
});`;

const files = [
  'c:/Users/ubaid/dahr/web/guide/shahada.html',
  'c:/Users/ubaid/dahr/web/guide/wudu.html',
  'c:/Users/ubaid/dahr/web/guide/salah.html',
  'c:/Users/ubaid/dahr/web/guide/gusl.html'
];

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');

  // 1. Add early theme script right after <head> opening if not already there
  if (!content.includes('(function(){\n  var isDark')) {
    content = content.replace(/<head>(\r?\n)/, `<head>$1${earlyThemeScript}\n`);
    console.log('Added early script to', f);
  } else {
    console.log('Early script already in', f);
  }

  // 2. Make sure postMessage listener exists (add if missing)
  if (!content.includes("e.data.type === 'set-theme'")) {
    // Add before </script> at end
    content = content.replace(/(\nrender\(\);\n<\/script>)/, `${postMessageListener}\n$1`);
    console.log('Added postMessage listener to', f);
  } else {
    console.log('postMessage listener already in', f);
  }

  fs.writeFileSync(f, content, 'utf8');
}

console.log('\nAll done!');
