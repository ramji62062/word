import re

with open('/Users/ramji/Desktop/ms-word-clone/index.html', 'r') as f:
    text = f.read()

extractor_code = """
    let extractedQuestionsList = [];

    function openExamExtractorModal() {
      const modal = document.getElementById('examExtractorModal');
      if (modal) {
          modal.style.display = 'flex';
          runExamFilter('all');
      } else {
          alert('Extractor modal not found in HTML. Check Starter UI.');
      }
    }

    function closeExamExtractorModal() {
      const modal = document.getElementById('examExtractorModal');
      if (modal) modal.style.display = 'none';
    }

    function runExamFilter(type) {
      let rawBlocks = [];
      const pdfItems = document.querySelectorAll('.pdf-edit-item');

      if (pdfItems.length > 0) {
        // Fix for multiple columns!
        const itemsArr = Array.from(pdfItems).map(item => ({
          text: (item.innerText || item.textContent || '').trim(),
          top: parseFloat(item.style.top || '0'),
          left: parseFloat(item.style.left || '0')
        })).filter(x => x.text.length > 0);

        let currentLine = '';
        let lastTop = -999;
        
        itemsArr.forEach(item => {
          if (lastTop === -999 || Math.abs(item.top - lastTop) < 14) {
             currentLine += (currentLine ? '   ' : '') + item.text;
          } else {
             if (currentLine.trim()) rawBlocks.push(currentLine.trim());
             currentLine = item.text;
          }
          lastTop = item.top;
        });
        if (currentLine.trim()) rawBlocks.push(currentLine.trim());
      } else {
        const docText = typeof editor !== 'undefined' && editor ? (editor.innerText || '') : '';
        rawBlocks = docText.split(/\\n+/).map(b => b.trim()).filter(b => b.length > 3);
      }

      const resultBox = document.getElementById('examExtractResult');
      const countEl = document.getElementById('examExtractCount');

      if (!rawBlocks.length) {
        if(resultBox) resultBox.innerHTML = '<p style="color:#888;">Document is empty! Open a JEE/GATE PDF first.</p>';
        if(countEl) countEl.innerText = '0 questions found';
        extractedQuestionsList = [];
        return;
      }

      extractedQuestionsList = [];

      const qNumRegex = /^(Q\\.?\\s*\\d+|Question\\s*\\d+|Problem\\s*\\d+|\\bQ\\s*\\d+|\\d+[\\.\\)])\\s*(.*)/i;
      const mcqOptionRegex = /\\([A-D]\\)|\\b\\[[A-D]\\]|\\b[A-D][\\.\\)]\\s+|\\b(Option\\s*[A-D]|Ans|Answer\\s*:)/i;
      const mathFormulaRegex = /[∫∑√±=≤≥≠∞λπθΔ]|\\b(lim|log|sin|cos|tan|det|matrix|dx|dt|d\\/dx|dy\\/dx|keV|MeV|mol|kg|m\\/s)\\b/i;
      const questionWordRegex = /\\b(what|why|how|calculate|find|determine|evaluate|solve|which|prove)\\b/i;

      let currentQ = '';
      let linesInCurrentQ = 0;

      rawBlocks.forEach((block) => {
        const isNewQ = qNumRegex.test(block) || (block.endsWith('?') && block.length < 200);
        const hasOptions = mcqOptionRegex.test(block);
        const hasFormula = mathFormulaRegex.test(block);
        
        if (isNewQ) {
          if (currentQ.trim()) extractedQuestionsList.push(currentQ.trim());
          currentQ = block;
          linesInCurrentQ = 1;
        } else if (currentQ) {
          if (linesInCurrentQ > 15 || (block.length > 300 && !hasOptions)) {
            extractedQuestionsList.push(currentQ.trim());
            currentQ = '';
            linesInCurrentQ = 0;
          } else {
            currentQ += '\\n' + block;
            linesInCurrentQ++;
          }
        } else if (!currentQ && (hasOptions || (hasFormula && block.length < 100))) {
          extractedQuestionsList.push(block);
        }
      });
      if (currentQ.trim()) extractedQuestionsList.push(currentQ.trim());

      if (type === 'mcq') {
        extractedQuestionsList = extractedQuestionsList.filter(q => mcqOptionRegex.test(q));
      } else if (type === 'numerical') {
        extractedQuestionsList = extractedQuestionsList.filter(q => !mcqOptionRegex.test(q) && (/\\d+/.test(q) || mathFormulaRegex.test(q)));
      } else if (type === 'formulas') {
        extractedQuestionsList = extractedQuestionsList.filter(q => mathFormulaRegex.test(q));
      }

      if (!extractedQuestionsList.length) {
         let fallback = rawBlocks.filter(b => b.endsWith('?') || questionWordRegex.test(b) || mathFormulaRegex.test(b));
         if (fallback.length > 25) fallback = fallback.slice(0, 25);
         if (!fallback.length && rawBlocks.length > 0) fallback = rawBlocks.slice(0, 10);
         extractedQuestionsList = fallback;
      }

      if(countEl) countEl.innerText = `${extractedQuestionsList.length} items extracted`;
      if(resultBox) {
        resultBox.innerHTML = extractedQuestionsList.map((item, idx) => `
          <div style="background:white; border:1px solid #e1dfdd; border-radius:4px; padding:10px 12px; margin-bottom:10px; box-shadow:0 1px 3px rgba(0,0,0,0.05); white-space:pre-wrap;">
            <strong style="color:#185abd; font-size:12px;">Problem #${idx + 1}:</strong>
            <div style="margin-top:4px; font-size:12.5px; line-height:1.4;">${item.replace(/</g, '&lt;')}</div>
          </div>
        `).join('');
      }
    }

    function openExtractedInNewDocument() {
      if (!extractedQuestionsList.length) return alert('No questions extracted.');
      closeExamExtractorModal();

      const pageContainer = document.getElementById('pageContainer');
      if (pageContainer) pageContainer.innerHTML = ''; 

      const newPage = document.createElement('div');
      newPage.className = 'page';
      newPage.id = 'editor';
      newPage.contentEditable = 'true';
      newPage.spellcheck = true;

      const questionsHtml = `
        <div style="border-bottom: 2px solid #185abd; padding-bottom: 12px; margin-bottom: 16px;">
          <h1 style="color: #185abd; font-size: 18pt; margin: 0 0 4pt 0;">🎯 JEE / GATE Extracted Study Questions</h1>
          <p style="color: #666; font-size: 10.5pt; margin: 0;">Extracted • Ready for Clean Revision & Print</p>
        </div>
        ${extractedQuestionsList.map((q, idx) => `
          <div style="margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px dashed #d2d0ce; line-height:1.4;">
            <strong style="color:#185abd;">Q${idx + 1}.</strong> ${q.replace(/</g, '&lt;').replace(/\\n/g, '<br>')}
          </div>
        `).join('')}
        <p><br></p>
      `;

      newPage.innerHTML = questionsHtml;
      if (pageContainer) pageContainer.appendChild(newPage);

      const docNameEl = document.getElementById('docName');
      if (docNameEl) docNameEl.innerText = `Extracted_Questions.docx`;
      if (typeof updateDocTitle === 'function') updateDocTitle();

      newPage.addEventListener('keyup', () => { if(typeof updateToolbarState==='function') updateToolbarState(); });
      newPage.addEventListener('mouseup', () => { if(typeof updateToolbarState==='function') updateToolbarState(); });

      if (typeof showAppToast === 'function') {
        showAppToast('<i class="fa-solid fa-file-circle-check" style="color:#69e781;"></i> <b>Fresh Study Document Created!</b> Previous PDF closed.');
      }
      
      if (typeof editor !== 'undefined') {
        window.editor = newPage;
      }
    }
"""

parts = text.rsplit('</script>', 1)
if len(parts) == 2:
    new_text = parts[0] + extractor_code + '\\n</script>' + parts[1]
    with open('/Users/ramji/Desktop/ms-word-clone/index.html', 'w') as f:
        f.write(new_text)
    print("Extractor logic injected cleanly.")
else:
    print("Could not find </script>")
