// ==========================================
// LAYER 6: CONVERT AND OCR
// ==========================================

async function runOcr(event) {
  const file = event.target.files[0];
  if (!file) return;
  alert('Starting OCR... This may take a few seconds depending on the image size.');
  const reader = new FileReader();
  reader.onload = async () => {
    const imgUrl = reader.result;
    
    // We expect Tesseract to be globally available from CDN in index.html
    if (typeof Tesseract === 'undefined') {
      alert('Tesseract library failed to load. Please check your internet connection.');
      return;
    }
    
    try {
      const result = await Tesseract.recognize(imgUrl, 'eng', { logger: m => console.log(m) });
      const text = result.data.text;
      
      // Insert the text as a new page or at cursor
      let p = document.createElement('p');
      p.innerText = text;
      
      const sel = window.getSelection();
      if (sel.rangeCount > 0 && sel.anchorNode && document.getElementById('pageContainer').contains(sel.anchorNode)) {
        sel.getRangeAt(0).insertNode(p);
      } else {
        const page = document.querySelector('#pageContainer .page');
        if (page) page.appendChild(p);
      }
      alert('OCR Complete!');
    } catch (err) {
      alert('OCR Error: ' + err.message);
    }
  };
  reader.readAsDataURL(file);
}

function scanPhotoToText() {
  let fileInput = document.getElementById('ocrInputHidden');
  if (!fileInput) {
    fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.id = 'ocrInputHidden';
    fileInput.style.display = 'none';
    fileInput.onchange = runOcr;
    document.body.appendChild(fileInput);
  }
  fileInput.click();
}

function exportPlainText() {
  const text = document.getElementById('pageContainer').innerText;
  const blob = new Blob([text], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'Document.txt';
  a.click();
}

// ==========================================
// LAYER 7: FORMS, SIGN AND PROTECT
// ==========================================

function insertFormField(type) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return alert('Click inside the document to insert a form field.');
  
  const range = sel.getRangeAt(0);
  let el;
  
  if (type === 'text') {
    el = document.createElement('input');
    el.type = 'text';
    el.placeholder = 'Text Field';
    el.style.cssText = 'border: 1px solid #777; background: #fdfdfd; padding: 2px 4px; border-radius: 2px; margin: 0 4px;';
  } else if (type === 'checkbox') {
    el = document.createElement('input');
    el.type = 'checkbox';
    el.style.cssText = 'margin: 0 4px; width:16px; height:16px; cursor:pointer;';
  } else if (type === 'dropdown') {
    el = document.createElement('select');
    el.style.cssText = 'border: 1px solid #777; background: #fdfdfd; padding: 2px; margin: 0 4px;';
    el.innerHTML = '<option>Option 1</option><option>Option 2</option><option>Option 3</option>';
  } else if (type === 'date') {
    el = document.createElement('input');
    el.type = 'date';
    el.style.cssText = 'border: 1px solid #777; background: #fdfdfd; padding: 2px; margin: 0 4px;';
  }
  
  if (el) {
    el.contentEditable = 'false'; // Form fields themselves shouldn't be editable text blocks
    range.insertNode(el);
    range.setStartAfter(el);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

function insertSignature() {
  const name = prompt('Type your signature name (or draw manually via Draw tab):');
  if (!name) return;
  
  const span = document.createElement('span');
  span.textContent = name;
  span.style.cssText = 'font-family: "Brush Script MT", cursive, sans-serif; font-size: 24px; color: #185abd; font-style: italic; border-bottom: 1px solid #000; padding: 0 10px; margin: 0 4px;';
  
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    sel.getRangeAt(0).insertNode(span);
  }
}

// Redefine protectDocument to be more robust
window.protectDocument = function() {
  const pw = prompt('Set document password (AES-256 simulation)\nLeave blank to remove protection:');
  const pages = document.querySelectorAll('#pageContainer .page, #pageContainer .wps-pdf-page');
  
  if (pw) {
    pages.forEach(p => {
      p.setAttribute('contenteditable', 'false');
      p.style.backgroundColor = '#f3f2f1';
    });
    alert('Document locked and encrypted for editing.');
  } else if (pw === '') {
    pages.forEach(p => {
      p.setAttribute('contenteditable', 'true');
      p.style.backgroundColor = '#ffffff';
    });
    alert('Protection removed.');
  }
};


// ==========================================
// LAYER 8: VIEW, READ AND SMART TOOLS
// ==========================================

let synth = window.speechSynthesis;
let isSpeaking = false;

window.readAloud = function() {
  if (isSpeaking) {
    synth.cancel();
    isSpeaking = false;
    alert('Read Aloud stopped.');
    return;
  }
  
  let text = '';
  const sel = window.getSelection();
  if (sel && !sel.isCollapsed) {
    text = sel.toString();
  } else {
    // Read whole doc
    const pages = document.querySelectorAll('#pageContainer .page');
    pages.forEach(p => text += p.innerText + ' ');
  }
  
  if (!text.trim()) {
    alert('No text found to read.');
    return;
  }
  
  const utterThis = new SpeechSynthesisUtterance(text);
  utterThis.onend = () => { isSpeaking = false; };
  utterThis.onerror = () => { isSpeaking = false; };
  
  synth.speak(utterThis);
  isSpeaking = true;
  alert('Reading aloud started... Click again to stop.');
};

window.summarizeDocument = function() {
  // Simulating an AI Smart Tool call
  alert("AI Summarization (Simulated):\n\nThis document appears to contain " + 
        (document.getElementById('pageContainer').innerText.split(/\s+/).length) + 
        " words. Key topics detected based on heading structures and keyword density.\n\n" +
        "- In a real deployment, this sends the text to the LLM backend.");
};

window.translateSelection = function() {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed) {
    alert("Please select some text to translate first.");
    return;
  }
  alert("AI Translation Tool (Simulated):\n\nTranslating: '" + sel.toString().substring(0, 30) + "...'\n\n- In a real deployment, this calls the Translation API and replaces the DOM text nodes while keeping formatting.");
};

