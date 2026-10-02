import os
import re

def bundle(base_dir, html_file):
    with open(os.path.join(base_dir, html_file), 'r') as f:
        html = f.read()

    def replace_css(match):
        css_file = match.group(1).split('?')[0]
        with open(os.path.join(base_dir, css_file), 'r') as f:
            css = f.read()
        return f'<style>{css}</style>'
    
    html = re.sub(r'<link\s+rel="stylesheet"\s+href="([^"]+)">', replace_css, html)
    
    def replace_js(match):
        type_attr = match.group(1) or ''
        js_file = match.group(2).split('?')[0]
        if js_file.startswith('http'):
            return match.group(0)
        
        with open(os.path.join(base_dir, js_file), 'r') as f:
            js = f.read()
            
        if 'module' in type_attr:
            return f'<script type="module">{js}</script>'
        return f'<script>{js}</script>'
    
    html = re.sub(r'<script\s+(type="module"\s+)?src="([^"]+)"></script>', replace_js, html)
    
    return html

bundled_html = bundle('/Users/ramji/Desktop/pdfeditor', 'index.html')
with open('/Users/ramji/Desktop/ms-word-clone/index.html', 'w') as f:
    f.write(bundled_html)

print("Bundled successfully!")
