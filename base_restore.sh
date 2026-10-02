cat << 'EOF' > index.html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document - Word</title>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
  <style>
    :root {
      --primary: #185abd; /* MS Word Blue */
      --primary-dark: #103f8a;
      --bg-ribbon: #f3f2f1;
      --bg-workspace: #e2e8f0;
      --text-main: #323130;
      --border: #c8c6c4;
      --hover: #e1dfdd;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: var(--text-main); height: 100vh; display: flex; flex-direction: column; overflow: hidden; background: var(--bg-workspace); }

    /* Title Bar */
    .title-bar {
      background-color: var(--primary);
      color: white;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      font-size: 14px;
      user-select: none;
    }
    .title-left { display: flex; align-items: center; gap: 16px; }
    .title-left i { font-size: 20px; }
    .title-center { font-weight: 600; font-size: 16px; }
    .title-right { display: flex; gap: 12px; }
    .title-btn { background: transparent; border: none; color: white; cursor: pointer; padding: 6px 12px; border-radius: 4px; }
    .title-btn:hover { background: var(--primary-dark); }

    /* Ribbon Tabs */
    .ribbon-container { background-color: var(--bg-ribbon); border-bottom: 1px solid var(--border); display: flex; flex-direction: column; }
    .ribbon-tabs { display: flex; list-style: none; padding-left: 8px; margin-top: 8px; }
    .ribbon-tab { padding: 6px 16px; margin-bottom: -1px; cursor: pointer; color: var(--text-main); font-size: 14px; border: 1px solid transparent; border-bottom: none; border-radius: 4px 4px 0 0; }
    .ribbon-tab.active { background-color: white; border-color: var(--border); font-weight: 600; }
    .ribbon-tab:hover:not(.active) { background-color: var(--hover); }

    /* Ribbon Toolbar */
    .ribbon-toolbar { background-color: white; height: 92px; display: flex; align-items: center; padding: 8px 16px; gap: 16px; border-top: 1px solid var(--border); }
    .ribbon-group { display: flex; flex-direction: column; align-items: center; border-right: 1px solid var(--border); padding-right: 16px; height: 100%; justify-content: center; position: relative; }
    .ribbon-group-label { font-size: 11px; color: #605e5c; position: absolute; bottom: 2px; }
    .ribbon-row { display: flex; align-items: center; gap: 4px; margin-bottom: 16px; }
    
    .toolbar-btn { background: transparent; border: 1px solid transparent; padding: 4px 8px; border-radius: 4px; cursor: pointer; color: var(--text-main); display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 40px; height: 50px; }
    .toolbar-btn.small { height: 28px; min-width: 28px; flex-direction: row; }
    .toolbar-btn i { font-size: 16px; margin-bottom: 4px; }
    .toolbar-btn.small i { margin-bottom: 0; }
    .toolbar-btn:hover { background-color: var(--hover); }
    .toolbar-btn.active { background-color: #cde6f7; border-color: #92c0e0; }

    .toolbar-select { padding: 4px; border: 1px solid var(--border); border-radius: 2px; outline: none; font-family: inherit; font-size: 13px; }
    .toolbar-color { width: 28px; height: 28px; padding: 0; border: 1px solid var(--border); cursor: pointer; border-radius: 2px; }

    /* Workspace */
    .workspace { flex: 1; overflow: auto; padding: 32px; display: flex; justify-content: center; }
    
    /* The Page */
    .page {
      background-color: white;
      width: 21cm; /* A4 width */
      min-height: 29.7cm; /* A4 height */
      padding: 2.54cm; /* 1 inch margins */
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      outline: none;
      font-family: 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.15;
      color: black;
      cursor: text;
    }

    .page p { margin-bottom: 8pt; }
  </style>
</head>
<body>

  <!-- Title Bar -->
  <header class="title-bar">
    <div class="title-left">
      <i class="fa-solid fa-file-word"></i>
      <button class="title-btn" onclick="saveDoc()"><i class="fa-regular fa-floppy-disk"></i></button>
      <button class="title-btn" onclick="format('undo')"><i class="fa-solid fa-rotate-left"></i></button>
      <button class="title-btn" onclick="format('redo')"><i class="fa-solid fa-rotate-right"></i></button>
    </div>
    <div class="title-center">Document1 - Word</div>
    <div class="title-right">
      <button class="title-btn"><i class="fa-solid fa-minus"></i></button>
      <button class="title-btn"><i class="fa-regular fa-square"></i></button>
      <button class="title-btn"><i class="fa-solid fa-xmark"></i></button>
    </div>
  </header>

  <!-- Ribbon -->
  <nav class="ribbon-container">
    <ul class="ribbon-tabs">
      <li class="ribbon-tab">File</li>
      <li class="ribbon-tab active">Home</li>
      <li class="ribbon-tab">Insert</li>
      <li class="ribbon-tab">Design</li>
      <li class="ribbon-tab">Layout</li>
      <li class="ribbon-tab">References</li>
      <li class="ribbon-tab">Review</li>
      <li class="ribbon-tab">View</li>
    </ul>

    <div class="ribbon-toolbar">
      
      <!-- Clipboard -->
      <div class="ribbon-group" style="flex-direction: row; align-items: flex-start; gap: 4px;">
        <button class="toolbar-btn" style="height: 60px;" onclick="format('paste')" onmousedown="event.preventDefault()">
          <i class="fa-solid fa-paste" style="font-size: 24px; color: #d9a05b;"></i>
          <span style="font-size: 11px;">Paste</span>
        </button>
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <button class="toolbar-btn small" onclick="format('cut')" onmousedown="event.preventDefault()"><i class="fa-solid fa-scissors"></i></button>
          <button class="toolbar-btn small" onclick="format('copy')" onmousedown="event.preventDefault()"><i class="fa-regular fa-copy"></i></button>
          <button class="toolbar-btn small" onmousedown="event.preventDefault()"><i class="fa-solid fa-broom"></i></button>
        </div>
        <div class="ribbon-group-label">Clipboard</div>
      </div>

      <!-- Font -->
      <div class="ribbon-group">
        <div class="ribbon-row">
          <select class="toolbar-select" id="fontName" style="width: 130px;" onchange="format('fontName', this.value)" onmousedown="event.preventDefault()">
            <option value="Arial">Arial</option>
            <option value="Calibri" selected>Calibri</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
            <option value="Verdana">Verdana</option>
          </select>
          <select class="toolbar-select" id="fontSize" style="width: 50px;" onchange="format('fontSize', this.value)" onmousedown="event.preventDefault()">
            <option value="1">8</option>
            <option value="2">10</option>
            <option value="3" selected>12</option>
            <option value="4">14</option>
            <option value="5">18</option>
            <option value="6">24</option>
            <option value="7">36</option>
          </select>
          <button class="toolbar-btn small" onclick="format('increaseFontSize')" onmousedown="event.preventDefault()">A<i class="fa-solid fa-caret-up" style="font-size:10px;"></i></button>
          <button class="toolbar-btn small" onclick="format('decreaseFontSize')" onmousedown="event.preventDefault()">A<i class="fa-solid fa-caret-down" style="font-size:10px;"></i></button>
        </div>
        <div class="ribbon-row">
          <button class="toolbar-btn small" id="btn-bold" onclick="format('bold')" onmousedown="event.preventDefault()"><i class="fa-solid fa-bold"></i></button>
          <button class="toolbar-btn small" id="btn-italic" onclick="format('italic')" onmousedown="event.preventDefault()"><i class="fa-solid fa-italic"></i></button>
          <button class="toolbar-btn small" id="btn-underline" onclick="format('underline')" onmousedown="event.preventDefault()"><i class="fa-solid fa-underline"></i></button>
          <button class="toolbar-btn small" onclick="format('strikeThrough')" onmousedown="event.preventDefault()"><i class="fa-solid fa-strikethrough"></i></button>
          <button class="toolbar-btn small" onclick="format('subscript')" onmousedown="event.preventDefault()"><i class="fa-solid fa-subscript"></i></button>
          <button class="toolbar-btn small" onclick="format('superscript')" onmousedown="event.preventDefault()"><i class="fa-solid fa-superscript"></i></button>
          <div style="width: 1px; height: 20px; background: var(--border); margin: 0 4px;"></div>
          <input type="color" class="toolbar-color" id="hiliteColor" value="#ffff00" oninput="format('hiliteColor', this.value)" onmousedown="event.preventDefault()" title="Highlight">
          <input type="color" class="toolbar-color" id="foreColor" value="#000000" oninput="format('foreColor', this.value)" onmousedown="event.preventDefault()" title="Text Color">
        </div>
        <div class="ribbon-group-label">Font</div>
      </div>

      <!-- Paragraph -->
      <div class="ribbon-group">
        <div class="ribbon-row">
          <button class="toolbar-btn small" onclick="format('insertUnorderedList')" onmousedown="event.preventDefault()"><i class="fa-solid fa-list-ul"></i></button>
          <button class="toolbar-btn small" onclick="format('insertOrderedList')" onmousedown="event.preventDefault()"><i class="fa-solid fa-list-ol"></i></button>
          <button class="toolbar-btn small" onclick="format('outdent')" onmousedown="event.preventDefault()"><i class="fa-solid fa-outdent"></i></button>
          <button class="toolbar-btn small" onclick="format('indent')" onmousedown="event.preventDefault()"><i class="fa-solid fa-indent"></i></button>
        </div>
        <div class="ribbon-row">
          <button class="toolbar-btn small" id="btn-justifyLeft" onclick="format('justifyLeft')" onmousedown="event.preventDefault()"><i class="fa-solid fa-align-left"></i></button>
          <button class="toolbar-btn small" id="btn-justifyCenter" onclick="format('justifyCenter')" onmousedown="event.preventDefault()"><i class="fa-solid fa-align-center"></i></button>
          <button class="toolbar-btn small" id="btn-justifyRight" onclick="format('justifyRight')" onmousedown="event.preventDefault()"><i class="fa-solid fa-align-right"></i></button>
          <button class="toolbar-btn small" id="btn-justifyFull" onclick="format('justifyFull')" onmousedown="event.preventDefault()"><i class="fa-solid fa-align-justify"></i></button>
        </div>
        <div class="ribbon-group-label">Paragraph</div>
      </div>
      
    </div>
  </nav>

  <!-- Workspace -->
  <main class="workspace" onclick="focusEditor()">
    <!-- The actual document page -->
    <div class="page" id="editor" contenteditable="true" spellcheck="false">
      <p><br></p>
    </div>
  </main>

  <script>
    const editor = document.getElementById('editor');

    // Make sure we start with focus
    window.onload = () => {
      editor.focus();
      document.execCommand('defaultParagraphSeparator', false, 'p');
      document.execCommand('fontName', false, 'Calibri');
    };

    function focusEditor() {
      if (document.activeElement !== editor) {
        editor.focus();
      }
    }

    function format(command, value = null) {
      document.execCommand(command, false, value);
      editor.focus();
      updateToolbarState();
    }

    function saveDoc() {
      const content = editor.innerHTML;
      const html = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Export HTML To Doc</title></head><body>${content}</body></html>
      `;
      const blob = new Blob(['\ufeff', html], {
        type: 'application/msword'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Document.doc';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    // Update button states (active styling) when typing or clicking
    function updateToolbarState() {
      const commands = ['bold', 'italic', 'underline', 'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'];
      commands.forEach(cmd => {
        const btn = document.getElementById('btn-' + cmd);
        if (btn) {
          if (document.queryCommandState(cmd)) {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        }
      });

      // Update Font Family
      const font = document.queryCommandValue('fontName');
      if (font) {
        const cleanFont = font.replace(/['"]/g, '');
        const fontSelect = document.getElementById('fontName');
        for(let i=0; i<fontSelect.options.length; i++) {
          if (cleanFont.toLowerCase().includes(fontSelect.options[i].value.toLowerCase())) {
            fontSelect.selectedIndex = i;
            break;
          }
        }
      }

      // Update Font Size
      const size = document.queryCommandValue('fontSize');
      if (size) {
        const sizeSelect = document.getElementById('fontSize');
        sizeSelect.value = size;
      }
    }

    editor.addEventListener('keyup', updateToolbarState);
    editor.addEventListener('mouseup', updateToolbarState);
    editor.addEventListener('input', updateToolbarState);

    // Stop workspace clicks from stealing focus
    document.querySelector('.workspace').addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('workspace')) {
        e.preventDefault();
        editor.focus();
        
        // Place cursor at the end if clicking outside the page
        const range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    });
  </script>
</body>
</html>
EOF