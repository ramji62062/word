// ==========================================
// SECTION 3: FONT FAMILY, FONT SIZE, FONT COLOR, HIGHLIGHT
// ==========================================
(function() {
  document.execCommand('styleWithCSS', false, true);

  // Advanced selection wrapper for precise inline styling
  function applyCustomFormat(property, value) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    
    // If collapsed, we need to set the typing style for the next character.
    // Modern browsers handle this reasonably if we use document.execCommand where possible,
    // but for precise sizes, we might need a dummy span.
    if (sel.isCollapsed) {
       // Insert a zero-width space with the style
       const span = document.createElement('span');
       span.style[property] = value;
       span.innerHTML = '&#8203;'; // zero width space
       const range = sel.getRangeAt(0);
       range.insertNode(span);
       range.setStart(span, 1);
       range.collapse(true);
       sel.removeAllRanges();
       sel.addRange(range);
       return;
    }
    
    const range = sel.getRangeAt(0);
    // Wrap the selected contents in a span
    const span = document.createElement('span');
    span.style[property] = value;
    
    // Extract contents (this splits text nodes appropriately)
    try {
      span.appendChild(range.extractContents());
      range.insertNode(span);
      
      // Cleanup empty spans or normalize
      span.normalize();
      
      // Select the new span's contents
      sel.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      sel.addRange(newRange);
    } catch(e) {
      // Fallback for complex selections spanning multiple blocks
      console.warn("Complex selection format fallback");
    }
    
    if (window.updateToolbarState) window.updateToolbarState();
  }

  // Override global format function
  const origFormat = window.format;
  window.format = function(command, value = null) {
    document.execCommand('styleWithCSS', false, true);
    
    if (command === 'fontSize') {
      // If a custom pt size is passed (e.g. "18pt"), use our custom formatter
      if (typeof value === 'string' && (value.includes('pt') || value.includes('px'))) {
        applyCustomFormat('fontSize', value);
      } else {
        // Fallback to execCommand for 1-7
        document.execCommand('fontSize', false, value);
      }
    } else if (command === 'fontName') {
      document.execCommand('fontName', false, value);
    } else if (command === 'foreColor') {
      document.execCommand('foreColor', false, value);
    } else if (command === 'hiliteColor') {
      // 'hiliteColor' or 'backColor' depending on browser
      applyCustomFormat('backgroundColor', value);
    } else {
      document.execCommand(command, false, value);
    }
    
    const editor = window.editor || document.getElementById('editor');
    if (editor && !document.activeElement?.isContentEditable) editor.focus();
    if (window.updateToolbarState) window.updateToolbarState();
    if (window.updateStats) window.updateStats();
  };

  // Enhance toolbar state to read actual CSS styles of selection
  window.updateToolbarState = function() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    
    const node = sel.anchorNode;
    if (!node) return;
    const el = node.nodeType === 3 ? node.parentNode : node;
    if (!el || !el.closest('.page')) return;
    
    const computed = window.getComputedStyle(el);
    
    const bBold = document.getElementById('btn-bold');
    if (bBold) bBold.classList.toggle('active', computed.fontWeight === 'bold' || parseInt(computed.fontWeight) >= 700);
    
    const bItalic = document.getElementById('btn-italic');
    if (bItalic) bItalic.classList.toggle('active', computed.fontStyle === 'italic');
    
    const bUnder = document.getElementById('btn-underline');
    if (bUnder) bUnder.classList.toggle('active', computed.textDecorationLine.includes('underline'));
    
    const fn = document.getElementById('fontName');
    if (fn) {
       // Match first font family
       const family = computed.fontFamily.split(',')[0].replace(/['"]/g, '');
       // Check if it exists in dropdown
       const options = Array.from(fn.options).map(o => o.value);
       if (options.includes(family)) fn.value = family;
    }
    
    const fs = document.getElementById('fontSize');
    // For custom sizes we would need a custom input box. 
    // If it's a select, we can map common px to 1-7, or just show standard
  };

})();
