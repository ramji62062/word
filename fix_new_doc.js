function newDoc() {
  if (confirm('Create a new blank document? All unsaved changes will be lost.')) {
    createNewDocumentModel();
    toggleFileMenu(false);
  }
}

function createNewDocumentModel() {
  if (window.wpsPdfEngine) {
    window.wpsPdfEngine.destroy();
    window.wpsPdfEngine = null;
  }
  
  if (window.thumbCache) window.thumbCache.clear();
  if (window.thumbObserver) window.thumbObserver.disconnect();
  
  window.originalSourceFile = null;
  window.originalSourceKind = null;
  window.originalDocxZip = null;
  window.originalDocxXmlDoc = null;
  window.originalDocxRels = null;
  window.originalDocxImages = null;
  
  localStorage.removeItem('word_doc_draft');
  
  const pc = document.getElementById('pageContainer');
  pc.innerHTML = '';
  
  const page = document.createElement('div');
  page.className = 'page';
  page.id = 'editor';
  page.contentEditable = 'true';
  page.spellcheck = window.spellcheckEnabled || false;
  
  page.innerHTML = '<p style="font-family: Calibri, sans-serif; font-size: 11pt; text-align: left; color: #000000; margin-top: 0; margin-bottom: 6pt;"><br></p>';
  
  pc.appendChild(page);
  
  const docName = document.getElementById('docName');
  if (docName) docName.innerText = 'Untitled document.docx';
  
  window.editor = page;
  
  if (window.buildThumbnails) window.buildThumbnails();
  if (window.updateStats) window.updateStats();
  if (window.updateDocTitle) window.updateDocTitle();
  
  const fn = document.getElementById('fontName');
  if (fn) fn.value = 'Calibri';
  const fs = document.getElementById('fontSize');
  if (fs) fs.value = '3';
  ['btn-bold', 'btn-italic', 'btn-underline', 'btn-left', 'btn-center', 'btn-right', 'btn-justify'].forEach(id => {
    const b = document.getElementById(id);
    if (b) b.classList.remove('active');
  });
  const bLeft = document.getElementById('btn-left');
  if (bLeft) bLeft.classList.add('active');
  
  setTimeout(() => {
    page.focus();
    const p = page.querySelector('p');
    if (p) {
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(p);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, 50);
}

// Hook immediately
(function() {
  const fileInput = document.getElementById('fileDocInput');
  if (fileInput) {
    const origChange = fileInput.onchange;
    fileInput.onchange = function(e) {
      if (e.target.files.length > 0) {
         createNewDocumentModel();
      }
      if (origChange) {
        // Need to bind it correctly or call it safely
        origChange.call(fileInput, e);
      }
    };
  }
})();
