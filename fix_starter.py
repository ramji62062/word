import re
with open('/Users/ramji/Desktop/ms-word-clone/index.html', 'r') as f:
    text = f.read()

with open('/Users/ramji/Desktop/ms-word-clone/update_starter.py', 'r') as f:
    script = f.read()

# Extract the html_to_inject from the script
import ast
html_to_inject = script.split('html_to_inject = """')[1].split('"""\n\nwith open(')[0]

# Replace the existing function
pattern = re.compile(r'function getStarterHeroHTML\(\)\s*\{.*?return `.*?`;\n\s*\}', re.DOTALL)
new_text = pattern.sub(html_to_inject, text)

with open('/Users/ramji/Desktop/ms-word-clone/index.html', 'w') as f:
    f.write(new_text)
print("Actually updated getStarterHeroHTML")
