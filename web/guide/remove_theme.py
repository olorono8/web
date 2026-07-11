import re

files = ['c:/Users/ubaid/dahr/web/guide/wudu.html', 'c:/Users/ubaid/dahr/web/guide/salah.html', 'c:/Users/ubaid/dahr/web/guide/gusl.html']

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # 1. Remove CSS
    css_pattern = r'\.tb-theme-btn\s*\{[^}]+\}\s*\.tb-theme-btn\s*svg\s*\{[^}]+\}\s*'
    content = re.sub(css_pattern, '', content)
    
    # 2. Remove HTML button block
    html_pattern = r'[ \t]*<div class="tb-right">\s*<button class="tb-theme-btn"[^>]+>\s*<span id="themeIcon"></span>\s*</button>\s*</div>\s*'
    content = re.sub(html_pattern, '', content)
    
    # 3. Replace JS block
    js_pattern = r'/\*\s*── THEME SVG ICONS ──\s*\*/.*?function toggleTheme\(\)\{.*?\n\}\s*'
    new_js = """// Dark mode listener for if it's set from index
let isDark = window.matchMedia('(prefers-color-scheme:dark)').matches;
try {
  const g = localStorage.getItem('globalTheme');
  if(g) isDark = g === 'dark';
} catch(e){}
if(isDark) document.documentElement.setAttribute('data-theme', 'dark');

"""
    content = re.sub(js_pattern, new_js, content, flags=re.DOTALL)
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)

print("Done editing HTML files.")
