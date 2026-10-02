// ==========================================
// FIX: REAL OOXML DOCX EXPORTER
// ==========================================
(function() {

  window.createStandardDocxBlob = async function() {
    if (!window.docx) {
       throw new Error("docx.js library not loaded");
    }

    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, AlignmentType, PageBreak, ImageRun, HeadingLevel, ShadingType } = window.docx;

    const pages = Array.from(document.querySelectorAll('#pageContainer .page'));
    const docChildren = [];

    // Helper: px or pt to half-points (docx uses half-points for font sizes)
    function parseSizeToHalfPoints(sizeStr) {
      if (!sizeStr) return 22; // 11pt default
      const val = parseFloat(sizeStr);
      if (sizeStr.includes('px')) return Math.round((val * 72 / 96) * 2);
      if (sizeStr.includes('pt')) return Math.round(val * 2);
      return 22;
    }

    function rgbToHex(rgbStr) {
      if (!rgbStr || rgbStr === 'rgba(0, 0, 0, 0)' || rgbStr === 'transparent') return null;
      if (rgbStr.startsWith('#')) return rgbStr.replace('#', '');
      const match = rgbStr.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!match) return null;
      return [1, 2, 3].map(i => {
        const hex = parseInt(match[i]).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('');
    }

    // Process an inline text node or element into an array of TextRuns
    function processInline(node, inheritedStyles = {}) {
      const runs = [];
      if (node.nodeType === 3) { // Text node
        const text = node.textContent;
        // Do not add empty text runs if they just contain whitespace outside normal flow,
        // but preserve spaces in sentences.
        if (!text) return runs;
        
        const runOptions = { text: text };
        
        if (inheritedStyles.bold) runOptions.bold = true;
        if (inheritedStyles.italic) runOptions.italics = true;
        if (inheritedStyles.underline) runOptions.underline = {};
        if (inheritedStyles.strike) runOptions.strike = true;
        if (inheritedStyles.color) runOptions.color = inheritedStyles.color;
        if (inheritedStyles.size) runOptions.size = inheritedStyles.size;
        if (inheritedStyles.font) runOptions.font = inheritedStyles.font;
        if (inheritedStyles.highlight) runOptions.highlight = inheritedStyles.highlight;

        runs.push(new TextRun(runOptions));
      } else if (node.nodeType === 1) { // Element node
        const tagName = node.tagName.toLowerCase();
        
        // Handle images
        if (tagName === 'img') {
           const src = node.getAttribute('src');
           if (src && src.startsWith('data:image/')) {
             try {
               const b64 = src.split(',')[1];
               const width = node.width || 400; // approximate
               const height = node.height || 300;
               // docx.js supports Uint8Array for image data
               const uint8 = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
               runs.push(new ImageRun({
                 data: uint8,
                 transformation: { width, height }
               }));
             } catch(e) { console.error("Img export failed", e); }
           }
           return runs;
        }

        const computed = window.getComputedStyle(node);
        const styles = { ...inheritedStyles };
        
        if (computed.fontWeight === 'bold' || parseInt(computed.fontWeight) >= 700 || tagName === 'b' || tagName === 'strong') styles.bold = true;
        if (computed.fontStyle === 'italic' || tagName === 'i' || tagName === 'em') styles.italic = true;
        if (computed.textDecorationLine.includes('underline') || tagName === 'u') styles.underline = true;
        if (computed.textDecorationLine.includes('line-through') || tagName === 'strike' || tagName === 's') styles.strike = true;
        
        const colorHex = rgbToHex(computed.color);
        if (colorHex && colorHex !== '000000') styles.color = colorHex;
        
        const bgHex = rgbToHex(computed.backgroundColor);
        // Map common highlights (docx has fixed highlight colors, so we just use the nearest string or shading)
        if (bgHex) {
           styles.highlight = 'yellow'; // Simplified approximation for highlight
        }

        const fontSize = computed.fontSize;
        if (fontSize) styles.size = parseSizeToHalfPoints(fontSize);

        const fontFamily = computed.fontFamily;
        if (fontFamily) styles.font = fontFamily.split(',')[0].replace(/['"]/g, '');

        node.childNodes.forEach(child => {
          runs.push(...processInline(child, styles));
        });
      }
      return runs;
    }

    // Process a block element (P, H1-H6, DIV) into a Paragraph or Table
    function processBlock(node) {
      const tagName = node.tagName.toLowerCase();
      
      // Ignore annotation layers and UI elements
      if (node.classList.contains('annotation-layer') || node.classList.contains('page-separator-btn')) {
         return null;
      }
      
      // Tables
      if (tagName === 'table') {
        const rows = [];
        node.querySelectorAll('tr').forEach(tr => {
           const cells = [];
           tr.querySelectorAll('td, th').forEach(td => {
             const cellChildren = [];
             td.childNodes.forEach(child => {
               if (child.nodeType === 1 && child.tagName.toLowerCase() !== 'br') {
                  const p = processBlock(child);
                  if (p) cellChildren.push(p);
               } else if (child.nodeType === 3 && child.textContent.trim()) {
                  cellChildren.push(new Paragraph({ children: processInline(child) }));
               }
             });
             cells.push(new TableCell({ children: cellChildren.length ? cellChildren : [new Paragraph("")] }));
           });
           rows.push(new TableRow({ children: cells }));
        });
        return new Table({ rows, width: { size: 100, type: "pct" } });
      }

      // Checklists (LI with checkboxes)
      // Actually we just map them as paragraphs for now, but handle alignment.
      const computed = window.getComputedStyle(node);
      const alignMap = { 'center': AlignmentType.CENTER, 'right': AlignmentType.RIGHT, 'justify': AlignmentType.JUSTIFIED, 'left': AlignmentType.LEFT };
      const alignment = alignMap[computed.textAlign] || AlignmentType.LEFT;

      const pOptions = {
         alignment,
         children: []
      };

      if (tagName === 'h1') pOptions.heading = HeadingLevel.HEADING_1;
      else if (tagName === 'h2') pOptions.heading = HeadingLevel.HEADING_2;
      else if (tagName === 'h3') pOptions.heading = HeadingLevel.HEADING_3;
      else if (tagName === 'h4') pOptions.heading = HeadingLevel.HEADING_4;

      // Check borders (e.g., divider)
      if (computed.borderBottomWidth !== '0px' && computed.borderBottomStyle !== 'none') {
         pOptions.border = { bottom: { color: "auto", space: 1, style: BorderStyle.SINGLE, size: 6 } };
      }
      
      // Background shading (Code blocks, note callouts)
      const bgHex = rgbToHex(computed.backgroundColor);
      if (bgHex && bgHex !== 'ffffff' && tagName !== 'span') {
         pOptions.shading = {
            type: ShadingType.CLEAR,
            fill: bgHex,
         };
      }

      // Extract text runs
      node.childNodes.forEach(child => {
         pOptions.children.push(...processInline(child, {}));
      });
      
      if (pOptions.children.length === 0) pOptions.children.push(new TextRun(""));
      return new Paragraph(pOptions);
    }

    pages.forEach((page, index) => {
      // Inject page break if not first page
      if (index > 0) {
        docChildren.push(new Paragraph({ children: [new PageBreak()] }));
      }
      
      Array.from(page.childNodes).forEach(child => {
         if (child.nodeType === 1) {
            const block = processBlock(child);
            if (block) docChildren.push(block);
         }
      });
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: docChildren
      }]
    });

    return await Packer.toBlob(doc);
  };

})();
