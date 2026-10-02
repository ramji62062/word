import re

html_code = """
      if (pdfItems.length > 0) {
        // Use DOM order (which PDF.js usually keeps in logical reading order) rather than strict top-left sorting
        // strict top-left sorting completely destroys two-column layouts by interleaving lines!
        const itemsArr = Array.from(pdfItems).map(item => ({
          text: (item.innerText || item.textContent || '').trim(),
          top: parseFloat(item.style.top || '0'),
          left: parseFloat(item.style.left || '0')
        })).filter(x => x.text.length > 0);

        // We will do a slight sort ONLY if things are extremely out of order vertically, 
        // but generally we trust the DOM order for columns.
        // Actually, just grouping them by vertical distance within the DOM order is safer.
        let currentLine = '';
        let lastTop = -999;
        
        itemsArr.forEach(item => {
          // If the vertical change is small, append to the same line
          if (lastTop === -999 || Math.abs(item.top - lastTop) < 14) {
             // If there's a huge horizontal gap (column jump), don't merge them as a single sentence!
             currentLine += (currentLine ? '   ' : '') + item.text;
          } else {
             if (currentLine.trim()) rawBlocks.push(currentLine.trim());
             currentLine = item.text;
          }
          lastTop = item.top;
        });
        if (currentLine.trim()) rawBlocks.push(currentLine.trim());
      } else {
"""

with open('/Users/ramji/Desktop/ms-word-clone/index.html', 'r') as f:
    text = f.read()

start_marker = "if (pdfItems.length > 0) {"
end_marker = "} else {\n        // Standard Document (.docx, editor)"

start_idx = text.find(start_marker)
end_idx = text.find(end_marker)

if start_idx != -1 and end_idx != -1:
    new_text = text[:start_idx] + html_code.strip() + "\n      " + text[end_idx:]
    with open('/Users/ramji/Desktop/ms-word-clone/index.html', 'w') as f:
        f.write(new_text)
    print("PDF extraction logic replaced")
else:
    print("Could not find markers")
