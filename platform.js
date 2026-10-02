(() => {
  const state = {
    view: 'Home',
    documentName: 'Quantum Mechanics Notes.pdf',
    undo: [],
    currentAction: null,
    editorMode: 'editable',
    sourceKind: 'demo',
    sourcePages: 0,
    semanticHtml: '',
    documents: [
      { name: 'Quantum Mechanics Notes.pdf', type: 'PDF', status: 'Indexed', changed: 'Just now' },
      { name: 'Gate_Maths_PYQs_2024.pdf', type: 'PDF', status: 'OCR running', changed: '8 min ago' },
      { name: 'Project_Thesis.docx', type: 'DOCX', status: 'Ready', changed: 'Yesterday' }
    ],
    mastery: [
      ['Engineering Mathematics', 72], ['Mechanics', 61], ['Electrostatics', 45], ['Thermodynamics', 38]
    ]
  };

  const views = ['Home', 'Documents', 'PDF Editor', 'AI', 'Study', 'PYQs', 'Practice', 'Mocks', 'Analytics'];
  const root = document.createElement('div');
  root.id = 'intelli-workspace';
  root.className = 'intelli-app';
  document.body.appendChild(root);
  document.body.classList.add('platform-active');

  const icon = (name) => `<i class="fa-solid fa-${name}"></i>`;
  const escape = (value) => String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);

  function render() {
    root.innerHTML = `
      <header class="intelli-topbar">
        <div class="intelli-brand"><span class="intelli-brand-mark">${icon('file-lines')}</span> IntelliDoc Studio</div>
        <nav class="intelli-tabs">${views.map(view => `<button data-view="${view}" class="${state.view === view ? 'active' : ''}">${view}</button>`).join('')}</nav>
        <button class="command-trigger" data-command-open>${icon('magnifying-glass')} Command <span>Ctrl K</span></button>
      </header>
      <div class="intelli-layout">
        ${renderSidebar()}
        <main class="workspace-main">${renderView()}</main>
        ${renderProperties()}
      </div>`;
    bindEvents();
  }

  function renderSidebar() {
    return `<aside class="intelli-sidebar">
      <button class="sidebar-create" data-open-file>${icon('plus')} Open or create document</button>
      <section class="sidebar-section"><div class="sidebar-label">Workspace</div>
        ${[['All documents','folder-open'],['Shared with me','users'],['Versions','code-branch'],['Templates','layer-group']].map(([label, ico], index) => `<button class="sidebar-item ${index === 0 ? 'active' : ''}">${icon(ico)} ${label}<span class="sidebar-count">${index === 0 ? state.documents.length : ''}</span></button>`).join('')}
      </section>
      <section class="sidebar-section"><div class="sidebar-label">Knowledge graph</div>
        <button class="sidebar-item">${icon('book-open')} Syllabus <span class="sidebar-count">42</span></button>
        <button class="sidebar-item">${icon('diagram-project')} Concepts <span class="sidebar-count">168</span></button>
        <button class="sidebar-item">${icon('circle-question')} Question bank <span class="sidebar-count">1,240</span></button>
        <button class="sidebar-item">${icon('triangle-exclamation')} Mistake notebook <span class="sidebar-count">12</span></button>
      </section>
      <section class="sidebar-section"><div class="sidebar-label">Background jobs</div>
        <button class="sidebar-item">${icon('magnifying-glass')} OCR & indexing <span class="sidebar-count">1</span></button>
        <button class="sidebar-item">${icon('shield-halved')} QA checks <span class="sidebar-count">Ready</span></button>
      </section>
    </aside>`;
  }

  function renderProperties() {
    return `<aside class="intelli-properties">
      <div class="agent-panel-title"><h2>${icon('sparkles')} Document Agent</h2><span class="agent-status"><i class="agent-dot"></i> Local-ready</span></div>
      <textarea class="agent-prompt" id="agentPrompt" placeholder="Try: Fix all formatting inconsistencies"></textarea>
      <div class="agent-actions"><button class="ui-btn primary" data-agent-run>Preview action</button><button class="ui-btn" data-agent-undo>Undo</button></div>
      <div id="agentPreview"></div>
      <div class="property-group"><h3>Document status</h3><div class="property-row"><span>Structure</span><strong>Recognized</strong></div><div class="property-row"><span>OCR languages</span><strong>English, Hindi</strong></div><div class="property-row"><span>Accessibility</span><strong>Needs 2 alt texts</strong></div></div>
      <div class="property-group"><h3>Safe editing</h3><div class="property-row"><span>Autosave</span><strong>On</strong></div><div class="property-row"><span>Version</span><strong>v12</strong></div><div class="property-row"><span>Permissions</span><strong>Owner</strong></div></div>
    </aside>`;
  }

  function renderView() {
    if (state.view === 'Documents') return renderDocuments();
    if (state.view === 'PDF Editor') return renderEditor();
    if (state.view === 'AI') return renderAiWorkspace();
    if (['Study', 'PYQs', 'Practice', 'Mocks', 'Analytics'].includes(state.view)) return renderStudy();
    return renderHome();
  }

  function header(title, sub, actions = '') { return `<div class="workspace-header"><div><h1>${title}</h1><p>${sub}</p></div><div class="workspace-actions">${actions}</div></div>`; }

  function renderHome() {
    return `${header('Workspace overview', 'A unified document, study, and assessment system.', '<button class="ui-btn" data-command-open>Command palette</button><button class="ui-btn primary" data-open-file>Open document</button>')}
      <div class="overview-grid"><div class="metric"><div class="metric-label">Documents indexed</div><div class="metric-value">24</div></div><div class="metric"><div class="metric-label">Study streak</div><div class="metric-value">6 days</div></div><div class="metric"><div class="metric-label">Questions mastered</div><div class="metric-value">412</div></div><div class="metric"><div class="metric-label">Pending QA checks</div><div class="metric-value">2</div></div></div>
      <section class="workspace-card"><div class="card-head"><h2>Recent documents</h2><span>PDF, DOCX, PPTX, XLSX conversion queue</span></div>${state.documents.map(renderDocumentRow).join('')}</section>
      <section class="workspace-card"><div class="card-head"><h2>Study recommendations</h2><span>Generated from your mistakes and mastery graph</span></div><div style="padding:8px 16px;">${state.mastery.map(([topic, score]) => `<div class="topic-row"><span>${topic}</span><span>${score}% mastery</span></div>`).join('')}</div></section>`;
  }

  function renderDocumentRow(doc) { return `<div class="document-row"><span style="color:#d53a44;font-size:18px;">${icon(doc.type === 'DOCX' ? 'file-word' : 'file-pdf')}</span><div><strong>${escape(doc.name)}</strong><small>${doc.type} - ${doc.changed}</small></div><span class="status-chip ${doc.status === 'OCR running' ? 'warn' : ''}">${doc.status}</span><button class="ui-btn" data-open-editor="${escape(doc.name)}">Open</button></div>`; }

  function renderDocuments() { return `${header('Documents', 'Semantic documents retain text, tables, figures, headers, and provenance.', '<button class="ui-btn primary" data-open-file>Import PDF or Office file</button>')}<section class="workspace-card"><div class="card-head"><h2>Document library</h2><span>Autosaved and versioned</span></div>${state.documents.map(renderDocumentRow).join('')}</section>`; }

  function demoDocumentHtml() { return '<h2>Quantum Mechanics: Revision Notes</h2><p>This editable canvas represents the document semantic model. Text, headings, equations, tables, figures, and annotations are separate object types, allowing reflow and safe transformations.</p><h3>Wave-particle duality</h3><p>For a particle, the de Broglie wavelength is lambda = h / p. Use this relationship when momentum is known and the question asks for wavelength.</p><table style="width:100%;border-collapse:collapse;margin:18px 0;"><tr><th style="border:1px solid #ccd5e2;padding:8px;text-align:left;">Concept</th><th style="border:1px solid #ccd5e2;padding:8px;text-align:left;">Status</th></tr><tr><td style="border:1px solid #ccd5e2;padding:8px;">Schrodinger equation</td><td style="border:1px solid #ccd5e2;padding:8px;">Review</td></tr></table><p><strong>Agent-ready:</strong> Request a rewrite, comparison, summary, translation, or PDF QA check from the right panel.</p>'; }

  function renderEditor() {
    const editable = state.semanticHtml || demoDocumentHtml();
    const hasPdfSource = state.sourceKind === 'pdf';
    const modeBar = hasPdfSource ? `<div class="editor-mode-bar"><button class="ui-btn ${state.editorMode === 'source' ? 'active' : ''}" data-editor-mode="source">${icon('eye')} Original PDF (${state.sourcePages || '...' } pages)</button><button class="ui-btn ${state.editorMode === 'editable' ? 'active' : ''}" data-editor-mode="editable">${icon('pen-to-square')} Editable reconstruction</button></div>` : '';
    const sourceNotice = hasPdfSource && state.editorMode === 'source' ? '<div class="import-notice">Original PDF view is rendered page-for-page. Switch to Editable reconstruction to change content without altering this source preview.</div>' : '';
    const content = hasPdfSource && state.editorMode === 'source' ? '<section class="source-preview" id="pdfSourcePreview"><div class="import-notice">Rendering original PDF pages...</div></section>' : `<article class="document-canvas" id="semanticCanvas" contenteditable="true">${editable}</article>`;
    return `${header(state.documentName, hasPdfSource ? 'Original PDF preview and editable semantic reconstruction.' : 'Structured document editing with imported formatting.', '<button class="ui-btn" data-agent-template="format">Fix formatting</button><button class="ui-btn primary" data-agent-template="tenpages">Prepare export</button>')}${modeBar}${sourceNotice}${content}`;
  }

  function renderAiWorkspace() { return `${header('AI Document Agent', 'All transformations create a preview, support rollback, and preserve the semantic model.')}<section class="workspace-card"><div class="card-head"><h2>Suggested actions</h2><span>Review before applying</span></div><div style="padding:16px;display:grid;gap:10px;">${['Make this exactly 10 pages','Fix all formatting inconsistencies','Prepare this contract for signing','Compare these documents','Find conflicting clauses','Convert this PDF into an editable structured document'].map(command => `<button class="ui-btn" data-agent-template="${escape(command)}" style="text-align:left;">${icon('sparkles')} ${escape(command)}</button>`).join('')}</div></section>`; }

  function renderStudy() {
    const isAnalytics = state.view === 'Analytics';
    return `${header(state.view, isAnalytics ? 'Mastery, practice behavior, and syllabus coverage.' : 'JEE and GATE intelligence generated from your knowledge graph.', '<button class="ui-btn primary" data-study-action>Start focused practice</button>')}
      <div class="study-grid"><section class="study-card"><h2>${icon('brain')} Adaptive plan</h2><p>Next: Electrostatics. Start from capacitance dependencies, then solve 12 medium PYQs.</p><button class="ui-btn" data-study-action>Open plan</button></section><section class="study-card"><h2>${icon('repeat')} Spaced repetition</h2><p>18 formula cards are due today. Four are from recent mistakes.</p><button class="ui-btn" data-study-action>Review cards</button></section><section class="study-card"><h2>${icon('stopwatch')} Timed practice</h2><p>GATE Mathematics: 25 questions, 45 minutes, difficulty adapts every five questions.</p><button class="ui-btn" data-study-action>Launch practice</button></section></div>
      <section class="workspace-card" style="margin-top:16px;"><div class="card-head"><h2>Concept mastery graph</h2><span>Student -> Subject -> Topic -> Concept -> Question -> Attempt -> Mistake -> Mastery</span></div><div style="padding:12px 16px;">${state.mastery.map(([topic, score]) => `<div class="topic-row"><span>${topic}</span><span style="width:45%;"><span class="progress-line"><span style="width:${score}%"></span></span></span><strong>${score}%</strong></div>`).join('')}</div></section>`;
  }

  function bindEvents() {
    root.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => { state.view = button.dataset.view; render(); }));
    root.querySelectorAll('[data-command-open]').forEach(button => button.addEventListener('click', openCommandPalette));
    root.querySelectorAll('[data-open-file]').forEach(button => button.addEventListener('click', () => document.getElementById('fileDocInput')?.click()));
    root.querySelectorAll('[data-open-editor]').forEach(button => button.addEventListener('click', () => { state.documentName = button.dataset.openEditor; state.view = 'PDF Editor'; render(); }));
    root.querySelectorAll('[data-editor-mode]').forEach(button => button.addEventListener('click', () => { state.editorMode = button.dataset.editorMode; render(); if (state.editorMode === 'source') renderPdfSource(); }));
    root.querySelectorAll('[data-agent-template]').forEach(button => button.addEventListener('click', () => previewAction(button.dataset.agentTemplate)));
    root.querySelector('[data-agent-run]')?.addEventListener('click', () => previewAction(root.querySelector('#agentPrompt').value));
    root.querySelector('[data-agent-undo]')?.addEventListener('click', undoAction);
    root.querySelectorAll('[data-study-action]').forEach(button => button.addEventListener('click', () => alert('Practice session created. This MVP stores the session locally; assessment delivery is the next service layer.')));
  }

  function previewAction(command) {
    const clean = (command || '').trim();
    if (!clean) return;
    state.currentAction = clean;
    const preview = root.querySelector('#agentPreview');
    if (!preview) { state.view = 'AI'; render(); setTimeout(() => previewAction(clean), 0); return; }
    preview.innerHTML = `<div class="agent-preview"><h3>${icon('wand-magic-sparkles')} Proposed action</h3><p>${actionExplanation(clean)}</p><button class="ui-btn primary" data-apply-action>Apply safely</button> <button class="ui-btn" data-dismiss-action>Dismiss</button></div>`;
    preview.querySelector('[data-apply-action]').addEventListener('click', applyAction);
    preview.querySelector('[data-dismiss-action]').addEventListener('click', () => { preview.innerHTML = ''; state.currentAction = null; });
  }

  function actionExplanation(command) {
    const lower = command.toLowerCase();
    if (lower.includes('10 pages')) return 'Estimate layout, flag overflow risks, and create a reversible pagination plan. No content will be deleted.';
    if (lower.includes('format')) return 'Normalize typography, list indentation, table spacing, and heading hierarchy while preserving text and explicit local styles.';
    if (lower.includes('sign')) return 'Add signature fields, document metadata, and a signing checklist. Encryption or legally binding eSign requires the security service.';
    if (lower.includes('compare')) return 'Create a semantic and visual comparison view with additions, removals, and formatting changes separated.';
    if (lower.includes('conflict')) return 'Scan clauses for conflicting dates, values, party names, and obligations. Findings remain suggestions until reviewed.';
    if (lower.includes('convert')) return 'Detect document blocks, reading order, tables, images, and headings, then stage an editable semantic reconstruction.';
    return 'Analyze the semantic document model and create a reversible change set. Review before applying.';
  }

  function applyAction() {
    const canvas = root.querySelector('#semanticCanvas');
    state.undo.push({ html: canvas?.innerHTML || '', doc: state.documentName });
    if (canvas) canvas.insertAdjacentHTML('beforeend', `<aside style="margin-top:22px;padding:12px;border-left:4px solid #1769e0;background:#eef5ff;"><strong>Agent change applied:</strong> ${escape(state.currentAction)}<br><small>Version checkpoint created. Use Undo to roll back this action.</small></aside>`);
    const preview = root.querySelector('#agentPreview');
    if (preview) preview.innerHTML = `<div class="agent-preview"><h3>Change applied</h3><p>A version checkpoint was created. You can undo this change.</p></div>`;
  }

  function undoAction() {
    const checkpoint = state.undo.pop();
    const canvas = root.querySelector('#semanticCanvas');
    if (!checkpoint || !canvas) return alert('There is no workspace action to undo.');
    canvas.innerHTML = checkpoint.html;
  }

  function openCommandPalette() {
    const backdrop = document.createElement('div');
    backdrop.className = 'command-backdrop';
    const commands = [
      ['Open PDF Editor', 'Go to document workspace', () => { state.view = 'PDF Editor'; render(); }],
      ['Import a document', 'PDF, DOCX, ODT, RTF, Markdown, image', () => document.getElementById('fileDocInput')?.click()],
      ['Fix formatting inconsistencies', 'Preview AI action', () => previewAction('Fix all formatting inconsistencies')],
      ['Extract questions from PDF', 'Create editable question bank', () => { state.view = 'Study'; render(); }],
      ['Start adaptive mock', 'Create a local practice session', () => { state.view = 'Mocks'; render(); }],
      ['Open Study AI', 'Ask questions using the open document', () => { state.view = 'Study'; render(); }]
    ];
    backdrop.innerHTML = `<div class="command-palette"><input autofocus placeholder="Search commands" aria-label="Search commands"><div class="command-list">${commands.map(([name, hint], index) => `<button class="command-option" data-command-index="${index}"><span>${escape(name)}</span><small>${escape(hint)}</small></button>`).join('')}</div></div>`;
    root.appendChild(backdrop);
    const input = backdrop.querySelector('input');
    input.focus();
    const options = [...backdrop.querySelectorAll('[data-command-index]')];
    options.forEach(option => option.addEventListener('click', () => { const command = commands[Number(option.dataset.commandIndex)]; backdrop.remove(); command[2](); }));
    input.addEventListener('input', () => options.forEach(option => { option.style.display = option.innerText.toLowerCase().includes(input.value.toLowerCase()) ? '' : 'none'; }));
    backdrop.addEventListener('click', event => { if (event.target === backdrop) backdrop.remove(); });
  }

  document.addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openCommandPalette(); } });
  async function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    state.documentName = file.name;
    state.documents.unshift({ name: file.name, type: (file.name.split('.').pop() || 'DOC').toUpperCase(), status: 'Importing', changed: 'Just now' });
    state.view = 'PDF Editor';
    state.semanticHtml = '<p>Preparing editable document structure...</p>';
    state.sourceKind = 'other';
    render();
    try {
      const extension = (file.name.split('.').pop() || '').toLowerCase();
      if (extension === 'pdf') await importPdf(file);
      else await importOfficeDocument(file, extension);
      state.documents[0].status = 'Indexed';
    } catch (error) {
      state.semanticHtml = `<h2>Import needs attention</h2><p>${escape(error.message || 'This document could not be read in the browser.')}</p>`;
      state.documents[0].status = 'Needs review';
      render();
    } finally { event.target.value = ''; }
  }

  async function importPdf(file) {
    if (!window.pdfjsLib) throw new Error('The PDF engine is unavailable. Reload with an internet connection and try again.');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    state.pdfData = await file.arrayBuffer();
    state.pdfDocument = await pdfjsLib.getDocument({ data: state.pdfData.slice(0) }).promise;
    state.sourceKind = 'pdf';
    state.sourcePages = state.pdfDocument.numPages;
    state.editorMode = 'source';
    state.semanticHtml = await extractPdfSemanticHtml(state.pdfDocument);
    render();
    renderPdfSource();
  }

  async function renderPdfSource() {
    const container = root.querySelector('#pdfSourcePreview');
    if (!container || !state.pdfDocument) return;
    container.innerHTML = '';
    for (let pageNumber = 1; pageNumber <= state.pdfDocument.numPages; pageNumber++) {
      const page = await state.pdfDocument.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.35 });
      const frame = document.createElement('figure');
      frame.className = 'pdf-page-frame';
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width; canvas.height = viewport.height;
      frame.appendChild(canvas);
      const caption = document.createElement('figcaption');
      caption.className = 'pdf-page-caption'; caption.textContent = `Original page ${pageNumber} of ${state.pdfDocument.numPages}`;
      frame.appendChild(caption); container.appendChild(frame);
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    }
  }

  async function extractPdfSemanticHtml(pdf) {
    let html = '';
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber); const content = await page.getTextContent();
      const lines = []; let line = ''; let previousY = null;
      content.items.forEach(item => { const y = Math.round(item.transform[5]); if (previousY !== null && Math.abs(y - previousY) > 4) { if (line.trim()) lines.push(line.trim()); line = ''; } line += `${item.str} `; previousY = y; });
      if (line.trim()) lines.push(line.trim());
      html += `<h2>Page ${pageNumber}</h2>${lines.map(line => `<p>${escape(line)}</p>`).join('')}`;
    }
    return html || '<p>This PDF is scanned or contains no selectable text. Use OCR to create an editable reconstruction while keeping the original PDF preview intact.</p>';
  }

  async function importOfficeDocument(file, extension) {
    state.editorMode = 'editable';
    if (extension === 'docx') {
      if (!window.mammoth) throw new Error('The DOCX reader is unavailable. Reload with an internet connection and try again.');
      const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
      state.semanticHtml = result.value || '<p>The DOCX file has no readable body content.</p>';
    } else if (['html', 'htm', 'doc'].includes(extension)) {
      const parsed = new DOMParser().parseFromString(await file.text(), 'text/html');
      state.semanticHtml = parsed.body.innerHTML || '<p>No document content found.</p>';
    } else {
      const text = await file.text();
      state.semanticHtml = text.split(/\r?\n/).map(line => line.trim() ? `<p>${escape(line)}</p>` : '<p><br></p>').join('');
    }
    render();
  }

  document.getElementById('fileDocInput')?.addEventListener('change', handleImport);
  render();
})();
