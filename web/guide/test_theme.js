const { JSDOM } = require("jsdom");

const html = `
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<script>
// Mock matchMedia
window.matchMedia = () => ({ matches: true });
// Mock localStorage
window.localStorage = { getItem: () => null };

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
</script>
</head>
<body></body>
</html>
`;

const dom = new JSDOM(html, { url: "https://example.com/shahada.html?v=4&theme=light", runScripts: "dangerously" });
console.log("Resulting data-theme:", dom.window.document.documentElement.getAttribute('data-theme'));
