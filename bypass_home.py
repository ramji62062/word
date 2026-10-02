import re

with open('/Users/ramji/Desktop/ms-word-clone/index.html', 'r') as f:
    text = f.read()

# 1. Hide home screen
text = text.replace('<div id="homeScreen">', '<div id="homeScreen" style="display:none;">')

# 2. Add an auto-start script at the end
auto_start = """
<script>
  window.addEventListener('load', () => {
    setTimeout(() => {
      const newBtn = document.querySelector('[data-action="new"]');
      if (newBtn) {
        newBtn.click();
      }
    }, 300);
  });
</script>
</body>
"""
text = text.replace('</body>', auto_start)

with open('/Users/ramji/Desktop/ms-word-clone/index.html', 'w') as f:
    f.write(text)

print("Bypassed home screen and auto-started blank document.")
