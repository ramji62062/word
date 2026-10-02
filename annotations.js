class AnnotationEngine {
  constructor() {
    this.currentMode = null; 
    this.drawing = false;
    this.currentColor = '#185abd'; 
    this.currentStroke = 3;
    this.activeSvg = null;
    this.activePath = null;
    this.pathData = '';
    
    this._handleSelection = this.handleSelection.bind(this);
    document.addEventListener('mouseup', this._handleSelection);
    // Remove global pointer down/up. We bind to specific page layers now.
  }

  setMode(mode, color = null) {
    this.currentMode = mode;
    if (color) this.currentColor = color;
    
    const pages = document.querySelectorAll('#pageContainer .page, #pageContainer .wps-pdf-page');
    pages.forEach(p => {
      const layer = this.getOrCreateLayer(p);
      if (['pen', 'highlight_pen', 'eraser'].includes(mode)) {
        layer.style.pointerEvents = 'auto';
        layer.style.touchAction = 'none';
        layer.style.cursor = mode === 'eraser' ? 'cell' : 'crosshair';
        p.setAttribute('contenteditable', 'false'); // Lock text while drawing
      } else {
        layer.style.pointerEvents = 'none';
        layer.style.touchAction = 'auto';
        layer.style.cursor = '';
        p.setAttribute('contenteditable', 'true');
      }
    });
  }

  getOrCreateLayer(pageEl) {
    let layer = pageEl.querySelector('.annotation-layer');
    if (!layer) {
      layer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      layer.setAttribute('class', 'annotation-layer');
      layer.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; z-index:50;';
      layer.style.pointerEvents = 'none';
      
      // Bind drawing events directly to the layer
      layer.addEventListener('pointerdown', (e) => this.handlePointerDown(e, layer, pageEl));
      layer.addEventListener('pointermove', (e) => this.handlePointerMove(e, layer));
      layer.addEventListener('pointerup', (e) => this.handlePointerUp(e, layer));
      layer.addEventListener('pointercancel', (e) => this.handlePointerUp(e, layer));
      
      pageEl.appendChild(layer);
    }
    return layer;
  }

  handlePointerDown(e, layer, pageEl) {
    if (!['pen', 'highlight_pen', 'eraser'].includes(this.currentMode)) return;
    e.preventDefault();
    layer.setPointerCapture(e.pointerId);
    
    if (this.currentMode === 'eraser') {
      if (e.target.tagName === 'path') {
        e.target.remove();
      }
      return;
    }
    
    this.drawing = true;
    this.activeSvg = layer;
    const rect = layer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.activePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    if (this.currentMode === 'highlight_pen') {
      this.activePath.setAttribute('stroke', this.currentColor);
      this.activePath.setAttribute('stroke-width', 20); // Thick for highlight
      this.activePath.setAttribute('opacity', '0.4');
      this.activePath.style.mixBlendMode = 'multiply';
    } else {
      this.activePath.setAttribute('stroke', this.currentColor);
      this.activePath.setAttribute('stroke-width', this.currentStroke);
    }
    
    this.activePath.setAttribute('fill', 'none');
    this.activePath.setAttribute('stroke-linecap', 'round');
    this.activePath.setAttribute('stroke-linejoin', 'round');
    this.pathData = 'M ' + x + ' ' + y;
    this.activePath.setAttribute('d', this.pathData);
    layer.appendChild(this.activePath);
  }

  handlePointerMove(e, layer) {
    if (this.currentMode === 'eraser' && e.buttons > 0) {
      if (e.target.tagName === 'path') e.target.remove();
      return;
    }
    
    if (!this.drawing || this.activeSvg !== layer || !this.activePath) return;
    const rect = layer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.pathData += ' L ' + x + ' ' + y;
    this.activePath.setAttribute('d', this.pathData);
  }

  handlePointerUp(e, layer) {
    if (layer.hasPointerCapture(e.pointerId)) {
      layer.releasePointerCapture(e.pointerId);
    }
    this.drawing = false;
    this.activeSvg = null;
    this.activePath = null;
  }

  handleSelection(e) {
    if (!['highlight', 'underline', 'strikethrough', 'squiggly'].includes(this.currentMode)) return;
    
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    
    for (let i = 0; i < sel.rangeCount; i++) {
      const range = sel.getRangeAt(i);
      const rects = range.getClientRects();
      let pageEl = range.commonAncestorContainer;
      if (pageEl.nodeType !== 1) pageEl = pageEl.parentElement;
      pageEl = pageEl.closest('.page') || pageEl.closest('.wps-pdf-page');
      if (!pageEl) continue;

      const layer = this.getOrCreateLayer(pageEl);
      const pageRect = layer.getBoundingClientRect();

      for (let j = 0; j < rects.length; j++) {
        const r = rects[j];
        const x = r.left - pageRect.left;
        const y = r.top - pageRect.top;
        const w = r.width;
        const h = r.height;

        if (this.currentMode === 'highlight') {
          const hl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          hl.setAttribute('x', x); hl.setAttribute('y', y);
          hl.setAttribute('width', w); hl.setAttribute('height', h);
          hl.setAttribute('fill', this.currentColor);
          hl.setAttribute('opacity', '0.4');
          hl.style.mixBlendMode = 'multiply';
          layer.appendChild(hl);
        } else if (this.currentMode === 'underline') {
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', x); line.setAttribute('y1', y + h - 2);
          line.setAttribute('x2', x + w); line.setAttribute('y2', y + h - 2);
          line.setAttribute('stroke', this.currentColor); line.setAttribute('stroke-width', '2');
          layer.appendChild(line);
        }
      }
    }
    sel.removeAllRanges();
    this.setMode(null); // Reset after single use of text tool
  }
}

AnnotationEngine.prototype.clearAll = function() {
  if (typeof document !== 'undefined') {
    document.querySelectorAll('.annotation-layer').forEach(layer => layer.innerHTML = '');
  }
};

if (typeof window !== 'undefined') {
  window.annotationEngine = new AnnotationEngine();
}
