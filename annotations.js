class AnnotationEngine {
  constructor() {
    this.currentMode = null; 
    this.drawing = false;
    this.currentColor = '#fce100'; 
    this.currentStroke = 3;
    this.activeSvg = null;
    this.activePath = null;
    this.pathData = '';
    
    this._handlePointerDown = this.handlePointerDown.bind(this);
    this._handlePointerMove = this.handlePointerMove.bind(this);
    this._handlePointerUp = this.handlePointerUp.bind(this);
    this._handleSelection = this.handleSelection.bind(this);
    this._handlePageClick = this.handlePageClick.bind(this);
    
    this.attachListeners();
  }

  attachListeners() {
    document.addEventListener('pointerdown', this._handlePointerDown);
    document.addEventListener('pointermove', this._handlePointerMove);
    document.addEventListener('pointerup', this._handlePointerUp);
    document.addEventListener('mouseup', this._handleSelection);
    document.addEventListener('click', this._handlePageClick);
  }

  setMode(mode, color = null) {
    this.currentMode = mode;
    if (color) this.currentColor = color;
    
    const pages = document.querySelectorAll('#pageContainer .page, #pageContainer .wps-pdf-page');
    pages.forEach(p => {
      p.style.cursor = mode === 'pen' ? 'crosshair' : 
                       mode === 'sticky' ? 'help' : 
                       mode === 'stamp' ? 'cell' : 'text';
    });
  }

  getOrCreateLayer(pageEl) {
    let layer = pageEl.querySelector('.annotation-layer');
    if (!layer) {
      layer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      layer.setAttribute('class', 'annotation-layer');
      layer.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:50;';
      pageEl.appendChild(layer);
    }
    return layer;
  }

  handlePointerDown(e) {
    if (!['pen', 'eraser', 'shape_rect', 'shape_circle', 'shape_arrow'].includes(this.currentMode)) return;
    const pageEl = e.target.closest('.page') || e.target.closest('.wps-pdf-page');
    if (!pageEl) return;
    
    this.drawing = true;
    this.activeSvg = this.getOrCreateLayer(pageEl);
    const rect = this.activeSvg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.currentMode === 'pen') {
      this.activePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      this.activePath.setAttribute('stroke', this.currentColor);
      this.activePath.setAttribute('stroke-width', this.currentStroke);
      this.activePath.setAttribute('fill', 'none');
      this.activePath.setAttribute('stroke-linecap', 'round');
      this.activePath.setAttribute('stroke-linejoin', 'round');
      this.pathData = 'M ' + x + ' ' + y;
      this.activePath.setAttribute('d', this.pathData);
      this.activeSvg.appendChild(this.activePath);
    }
  }

  handlePointerMove(e) {
    if (!this.drawing || !this.activeSvg || this.currentMode !== 'pen') return;
    const rect = this.activeSvg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.pathData += ' L ' + x + ' ' + y;
    this.activePath.setAttribute('d', this.pathData);
  }

  handlePointerUp(e) {
    if (this.drawing) {
      this.drawing = false;
      this.activeSvg = null;
      this.activePath = null;
    }
  }

  handlePageClick(e) {
    if (['sticky', 'stamp', 'typewriter'].includes(this.currentMode)) {
      const pageEl = e.target.closest('.page') || e.target.closest('.wps-pdf-page');
      if (!pageEl) return;
      
      const layer = this.getOrCreateLayer(pageEl);
      const rect = layer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (this.currentMode === 'sticky') {
        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        icon.setAttribute('x', x - 10); icon.setAttribute('y', y - 10);
        icon.setAttribute('width', 20); icon.setAttribute('height', 20);
        icon.setAttribute('fill', '#ffb900'); icon.setAttribute('stroke', '#000');
        icon.style.pointerEvents = 'auto'; icon.style.cursor = 'pointer';
        
        icon.onclick = () => {
          if (window.switchSidebarPanel) window.switchSidebarPanel('comments');
          const cText = prompt('Sticky Note Comment:');
          if (cText && window.addComment) window.addComment(cText);
        };
        layer.appendChild(icon);
      } else if (this.currentMode === 'stamp') {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x); text.setAttribute('y', y);
        text.setAttribute('fill', 'red'); text.setAttribute('font-size', '24px');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('transform', 'rotate(-15 ' + x + ' ' + y + ')');
        text.textContent = window._currentStampText || 'APPROVED';
        layer.appendChild(text);
      } else if (this.currentMode === 'typewriter') {
        const input = document.createElement('div');
        input.contentEditable = 'true';
        input.style.cssText = 'position:absolute; left:' + x + 'px; top:' + y + 'px; color:' + this.currentColor + '; font-size:14px; min-width:50px; min-height:20px; border:1px dashed #ccc; background:rgba(255,255,255,0.8); z-index:60; outline:none;';
        pageEl.appendChild(input);
        input.focus();
        input.onblur = () => input.style.border = 'none';
      }
      
      this.setMode(null);
    }
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
        } else if (this.currentMode === 'strikethrough') {
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', x); line.setAttribute('y1', y + h / 2);
          line.setAttribute('x2', x + w); line.setAttribute('y2', y + h / 2);
          line.setAttribute('stroke', this.currentColor); line.setAttribute('stroke-width', '2');
          layer.appendChild(line);
        } else if (this.currentMode === 'squiggly') {
          let path = 'M ' + x + ' ' + (y + h - 1);
          let up = true;
          for (let px = x + 3; px <= x + w; px += 3) {
            path += ' L ' + px + ' ' + (y + h - 1 + (up ? -2 : 2));
            up = !up;
          }
          const sq = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          sq.setAttribute('d', path);
          sq.setAttribute('stroke', this.currentColor);
          sq.setAttribute('stroke-width', '1.5');
          sq.setAttribute('fill', 'none');
          layer.appendChild(sq);
        }
      }
    }
    sel.removeAllRanges();
  }
}

AnnotationEngine.prototype.clearAll = function() {
  if (typeof document !== 'undefined') {
    document.querySelectorAll('.annotation-layer').forEach(layer => layer.innerHTML = '');
    document.querySelectorAll('[contenteditable]').forEach(el => {
      if(el.style.zIndex == '60') el.remove();
    });
  }
};

if (typeof window !== 'undefined') {
  window.annotationEngine = new AnnotationEngine();
}
