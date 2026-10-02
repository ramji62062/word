/**
 * WPS-Style PDF Engine (Layer 0 & Layer 1)
 * Features:
 * - Lazy multi-page virtual scrolling with memory caching (300+ page support)
 * - Pixel-accurate text extraction, font metrics & color sampling
 * - In-place text editing with zero ghost text / overlay masking
 * - Floating mini toolbar & selection-based editing
 * - WYSIWYG export with pdf-lib / canvas layer
 */

class WpsPdfEngine {
  constructor(options = {}) {
    this.container = options.container || document.getElementById('pageContainer');
    this.pdfDoc = null;
    this.pdfBytes = null;
    this.numPages = 0;
    this.scale = options.scale || 1.25;
    this.pageViewports = [];
    this.pageElements = [];
    this.renderedPages = new Set();
    this.pageTextData = new Map();
    this.activeEditor = null;
    this.observer = null;
    this.onStatusChange = options.onStatusChange || (() => {});
  }

  async load(fileOrBytes) {
    this.destroy();
    if (!window.pdfjsLib) {
      throw new Error('PDF.js library is required.');
    }
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    if (fileOrBytes instanceof File || fileOrBytes instanceof Blob) {
      this.pdfBytes = await fileOrBytes.arrayBuffer();
    } else {
      this.pdfBytes = fileOrBytes;
    }

    this.pdfDoc = await pdfjsLib.getDocument({ data: this.pdfBytes }).promise;
    this.numPages = this.pdfDoc.numPages;

    this.initVirtualScroller();
    return this.numPages;
  }

  initVirtualScroller() {
    this.container.innerHTML = '';
    this.renderedPages.clear();
    this.pageElements = [];
    this.pageViewports = [];

    // Create page placeholder wrappers for lazy virtual loading
    for (let pageNum = 1; pageNum <= this.numPages; pageNum++) {
      const pageWrapper = document.createElement('div');
      pageWrapper.className = 'page wps-pdf-page';
      pageWrapper.dataset.pageNum = pageNum;
      pageWrapper.style.cssText = `
        position: relative;
        width: 794px;
        min-height: 1123px;
        margin: 20px auto;
        background: #ffffff;
        box-shadow: 0 4px 16px rgba(0,0,0,0.18);
        box-sizing: border-box;
        overflow: hidden;
      `;

      // Loading skeleton
      const placeholder = document.createElement('div');
      placeholder.className = 'wps-page-placeholder';
      placeholder.style.cssText = 'position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:#888; font-size:13px;';
      placeholder.innerText = `Loading Page ${pageNum} of ${this.numPages}...`;
      pageWrapper.appendChild(placeholder);

      this.container.appendChild(pageWrapper);
      this.pageElements.push(pageWrapper);
    }

    // Setup IntersectionObserver for high-performance lazy page rendering
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const pageNum = parseInt(entry.target.dataset.pageNum, 10);
            this.renderPage(pageNum);
          }
        });
      }, {
        root: null,
        rootMargin: '400px 0px 400px 0px',
        threshold: 0.01
      });

      this.pageElements.forEach(el => this.observer.observe(el));
    } else {
      // Fallback: render initial pages
      for (let i = 1; i <= Math.min(5, this.numPages); i++) {
        this.renderPage(i);
      }
    }
  }

  async renderPage(pageNum) {
    if (this.renderedPages.has(pageNum)) return;
    this.renderedPages.add(pageNum);

    const pageWrapper = this.pageElements[pageNum - 1];
    if (!pageWrapper) return;

    try {
      const page = await this.pdfDoc.getPage(pageNum);
      const unscaledViewport = page.getViewport({ scale: 1 });
      const targetWidth = 794;
      const scale = targetWidth / unscaledViewport.width;
      const viewport = page.getViewport({ scale });

      this.pageViewports[pageNum - 1] = viewport;

      pageWrapper.style.width = `${viewport.width}px`;
      pageWrapper.style.height = `${viewport.height}px`;
      pageWrapper.style.minHeight = `${viewport.height}px`;
      pageWrapper.style.maxHeight = `${viewport.height}px`;
      pageWrapper.innerHTML = '';

      // Layer 0: High-fidelity Canvas rendering
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.className = 'wps-pdf-canvas';
      canvas.style.cssText = 'position:absolute; inset:0; width:100%; height:100%; pointer-events:none; z-index:0; display:block;';
      pageWrapper.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;

      // Layer 1: Text extraction and structured line grouping
      const textContent = await page.getTextContent();
      const lines = this.extractAndGroupLines(textContent, viewport, scale);

      // Analyze colors and alignment
      lines.forEach(line => {
        const analysis = this.analyzeLinePixels(ctx, line.left, line.top, line.width, line.height, canvas.width, canvas.height);
        line.bgColor = analysis.bgColor;
        line.textColor = analysis.textColor;
      });

      this.pageTextData.set(pageNum, lines);

      // Layer 2: Transparent interaction and inline editing layer
      const textLayer = document.createElement('div');
      textLayer.className = 'wps-pdf-text-layer';
      textLayer.style.cssText = 'position:absolute; inset:0; width:100%; height:100%; overflow:hidden; z-index:2; pointer-events:auto;';

      lines.forEach((line, lineIdx) => {
        if (!line.text.trim()) return;
        const lineEl = this.createLineElement(line, canvas, pageNum, lineIdx);
        textLayer.appendChild(lineEl);
      });

      pageWrapper.appendChild(textLayer);
      this.onStatusChange({ page: pageNum, total: this.numPages });
    } catch (err) {
      console.error(`Error rendering page ${pageNum}:`, err);
    }
  }

  extractAndGroupLines(textContent, viewport, scale) {
    const lines = [];
    const sortedItems = (textContent.items || []).filter(it => it.str && it.str.trim().length > 0);

    sortedItems.forEach(item => {
      const tx = item.transform;
      const fontSize = Math.hypot(tx[2], tx[3]) * scale || Math.hypot(tx[0], tx[1]) * scale || 14;
      const x = tx[4] * scale;
      const baselineY = viewport.height - tx[5] * scale;
      const y = baselineY - (fontSize * 0.88);
      const w = (item.width || (item.str.length * fontSize * 0.55)) * scale;

      const fontMeta = this.resolveFontMeta(item.fontName, textContent.styles && textContent.styles[item.fontName]?.fontFamily);

      let matchedLine = null;
      for (const l of lines) {
        if (Math.abs(l.baselineY - baselineY) <= 3) {
          const gapToRight = x - l.right;
          const gapToLeft = l.left - (x + w);
          const maxGap = Math.max(20, fontSize * 2);
          if ((gapToRight >= -5 && gapToRight <= maxGap) || (gapToLeft >= -5 && gapToLeft <= maxGap)) {
            matchedLine = l;
            break;
          }
        }
      }

      if (matchedLine) {
        matchedLine.items.push({ str: item.str, x, w, fontSize, fontMeta });
        matchedLine.left = Math.min(matchedLine.left, x);
        matchedLine.right = Math.max(matchedLine.right, x + w);
        matchedLine.top = Math.min(matchedLine.top, y);
        matchedLine.bottom = Math.max(matchedLine.bottom, y + fontSize);
        matchedLine.fontSize = Math.max(matchedLine.fontSize, fontSize);
        if (fontMeta.isBold) matchedLine.fontMeta = fontMeta;
      } else {
        lines.push({
          baselineY,
          top: y,
          bottom: y + fontSize,
          left: x,
          right: x + w,
          fontSize,
          fontMeta,
          items: [{ str: item.str, x, w, fontSize, fontMeta }]
        });
      }
    });

    lines.forEach(line => {
      line.items.sort((a, b) => a.x - b.x);
      let fullText = '';
      for (let i = 0; i < line.items.length; i++) {
        const it = line.items[i];
        if (i > 0) {
          const prev = line.items[i - 1];
          const gap = it.x - (prev.x + prev.w);
          if (gap > 2 && !fullText.endsWith(' ') && !it.str.startsWith(' ')) {
            fullText += ' ';
          }
        }
        fullText += it.str;
      }
      line.text = fullText;
      line.width = Math.max(line.right - line.left, 10);
      line.height = Math.max(line.bottom - line.top, line.fontSize);
      line.centerX = line.left + (line.width / 2);

      // Alignment detection
      const pageWidth = viewport.width;
      if (Math.abs(line.centerX - (pageWidth / 2)) < 35 && line.width < pageWidth * 0.85) {
        line.textAlign = 'center';
      } else if ((pageWidth - line.right) < 40 && line.left > 100) {
        line.textAlign = 'right';
      } else {
        line.textAlign = 'left';
      }
    });

    return lines;
  }

  resolveFontMeta(fontName, rawFamily) {
    const combined = `${fontName || ''} ${rawFamily || ''}`.toLowerCase();
    const isHeavy = combined.includes('heavy') || combined.includes('black') || combined.includes('extrabold') || combined.includes('ultra');
    const isBold = isHeavy || combined.includes('bold') || combined.includes('semibold') || combined.includes('medium');
    const isItalic = combined.includes('italic') || combined.includes('oblique');

    let fontFamily = "'Segoe UI', Arial, sans-serif";
    let matchedSelect = 'Segoe UI';

    if (combined.includes('times') || combined.includes('roman') || combined.includes('serif') || combined.includes('georgia')) {
      fontFamily = "'Times New Roman', Times, Georgia, serif";
      matchedSelect = 'Times New Roman';
    } else if (combined.includes('courier') || combined.includes('mono') || combined.includes('consolas') || combined.includes('code')) {
      fontFamily = "'Courier New', Consolas, Monaco, monospace";
      matchedSelect = 'Courier New';
    } else if (combined.includes('calibri') || combined.includes('aptos')) {
      fontFamily = "Calibri, Aptos, 'Segoe UI', sans-serif";
      matchedSelect = 'Calibri';
    } else if (combined.includes('arial') || combined.includes('helvetica') || combined.includes('sans')) {
      fontFamily = "Arial, 'Helvetica Neue', Helvetica, sans-serif";
      matchedSelect = 'Arial';
    } else if (combined.includes('georgia')) {
      fontFamily = "Georgia, serif";
      matchedSelect = 'Georgia';
    }

    const fontWeight = isHeavy ? '900' : (isBold ? 'bold' : 'normal');
    const fontStyle = isItalic ? 'italic' : 'normal';

    return { fontFamily, fontWeight, fontStyle, isBold, isHeavy, isItalic, matchedSelect };
  }

  analyzeLinePixels(ctx, left, top, width, height, canvasWidth, canvasHeight) {
    const pad = 3;
    const sampleLeft = Math.max(0, Math.floor(left - pad));
    const sampleTop = Math.max(0, Math.floor(top - pad));
    const sampleRight = Math.min(canvasWidth - 1, Math.ceil(left + width + pad));
    const sampleBottom = Math.min(canvasHeight - 1, Math.ceil(top + height + pad));
    const sampleW = Math.max(1, sampleRight - sampleLeft);
    const sampleH = Math.max(1, sampleBottom - sampleTop);

    let bgR = 255, bgG = 255, bgB = 255;
    let textR = 0, textG = 0, textB = 0;

    try {
      const imgData = ctx.getImageData(sampleLeft, sampleTop, sampleW, sampleH).data;
      const cornerOffsets = [
        0,
        (sampleW - 1) * 4,
        ((sampleH - 1) * sampleW) * 4,
        ((sampleH - 1) * sampleW + (sampleW - 1)) * 4
      ];
      let sumBgR = 0, sumBgG = 0, sumBgB = 0, bgCount = 0;
      cornerOffsets.forEach(idx => {
        if (idx >= 0 && idx + 3 < imgData.length) {
          sumBgR += imgData[idx];
          sumBgG += imgData[idx + 1];
          sumBgB += imgData[idx + 2];
          bgCount++;
        }
      });
      if (bgCount > 0) {
        bgR = Math.round(sumBgR / bgCount);
        bgG = Math.round(sumBgG / bgCount);
        bgB = Math.round(sumBgB / bgCount);
      }

      let maxDist = 0;
      let sumTextR = 0, sumTextG = 0, sumTextB = 0, textCount = 0;
      for (let i = 0; i < imgData.length; i += 4) {
        const r = imgData[i];
        const g = imgData[i + 1];
        const b = imgData[i + 2];
        const dist = Math.hypot(r - bgR, g - bgG, b - bgB);
        if (dist > 30) {
          sumTextR += r;
          sumTextG += g;
          sumTextB += b;
          textCount++;
          if (dist > maxDist) maxDist = dist;
        }
      }

      if (textCount > 0) {
        textR = Math.round(sumTextR / textCount);
        textG = Math.round(sumTextG / textCount);
        textB = Math.round(sumTextB / textCount);
      } else {
        textR = (bgR > 128) ? 0 : 255;
        textG = (bgG > 128) ? 0 : 255;
        textB = (bgB > 128) ? 0 : 255;
      }
    } catch (e) {
      bgR = 255; bgG = 255; bgB = 255;
      textR = 0; textG = 0; textB = 0;
    }

    return {
      bgColor: `rgb(${bgR}, ${bgG}, ${bgB})`,
      textColor: `rgb(${textR}, ${textG}, ${textB})`
    };
  }

  createLineElement(line, canvas, pageNum, lineIdx) {
    const lineEl = document.createElement('div');
    lineEl.className = 'pdf-hit-line';
    lineEl.contentEditable = 'false';
    lineEl.spellcheck = false;
    lineEl.textContent = line.text;
    lineEl.dataset.originalText = line.text;
    lineEl.dataset.pageNum = pageNum;
    lineEl.dataset.lineIdx = lineIdx;

    const maxAvailableWidth = Math.max(10, canvas.width - line.left - 4);
    lineEl.style.setProperty('--line-text-color', line.textColor);
    lineEl.style.setProperty('--line-bg-color', line.bgColor);
    lineEl.style.cssText = `
      position: absolute;
      left: ${line.left}px;
      top: ${line.top}px;
      width: ${line.width}px;
      font-size: ${line.fontSize}px;
      font-family: ${line.fontMeta.fontFamily};
      font-weight: ${line.fontMeta.fontWeight};
      font-style: ${line.fontMeta.fontStyle};
      text-align: ${line.textAlign};
      line-height: 1.15;
      white-space: pre;
      min-width: 8px;
      max-width: ${maxAvailableWidth}px;
      --line-text-color: ${line.textColor};
      --line-bg-color: ${line.bgColor};
    `;

    // Local In-Place Editing Trigger (Zero Ghost Text, Matching Styles)
    lineEl.addEventListener('click', (e) => {
      e.stopPropagation();
      if (lineEl.classList.contains('is-editing')) return;

      // 1. Immediately cover/erase original text on canvas with sampled background color
      try {
        const canvasCtx = canvas.getContext('2d');
        canvasCtx.fillStyle = line.bgColor;
        canvasCtx.fillRect(Math.max(0, line.left - 2), Math.max(0, line.top - 2), line.width + 4, line.height + 4);
      } catch (err) {}

      // 2. Activate live in-place editor with exact sampled font, weight, color and background
      lineEl.style.setProperty('--line-text-color', line.textColor);
      lineEl.style.setProperty('--line-bg-color', line.bgColor);
      lineEl.style.color = line.textColor;
      lineEl.style.backgroundColor = line.bgColor;
      lineEl.contentEditable = 'true';
      lineEl.classList.add('is-editing');
      lineEl.focus();

      // Show floating mini toolbar
      this.showMiniToolbar(lineEl, line);

      // Sync top toolbar controls
      this.syncToolbar(line);
    });

    lineEl.addEventListener('blur', () => {
      lineEl.contentEditable = 'false';
      lineEl.classList.remove('is-editing');
      lineEl.classList.add('is-edited');
      lineEl.style.setProperty('--line-text-color', line.textColor);
      lineEl.style.setProperty('--line-bg-color', line.bgColor);
      lineEl.style.color = line.textColor;
      lineEl.style.backgroundColor = line.bgColor;
      this.hideMiniToolbar();
    });

    lineEl.addEventListener('input', () => {
      // Keep centered alignment anchored around the original center point
      if (line.textAlign === 'center') {
        const newW = Math.max(line.width, lineEl.scrollWidth + 6);
        const newLeft = Math.max(8, line.centerX - (newW / 2));
        lineEl.style.width = `${newW}px`;
        lineEl.style.left = `${newLeft}px`;
      }
    });

    return lineEl;
  }

  showMiniToolbar(lineEl, line) {
    let toolbar = document.getElementById('wpsMiniToolbar');
    if (!toolbar) {
      toolbar = document.createElement('div');
      toolbar.id = 'wpsMiniToolbar';
      toolbar.className = 'wps-mini-toolbar';
      toolbar.innerHTML = `
        <button type="button" data-cmd="bold" title="Bold"><i class="fa-solid fa-bold"></i></button>
        <button type="button" data-cmd="italic" title="Italic"><i class="fa-solid fa-italic"></i></button>
        <button type="button" data-cmd="underline" title="Underline"><i class="fa-solid fa-underline"></i></button>
        <span class="wps-tb-divider"></span>
        <input type="color" id="miniTextColor" title="Text Color" value="#000000">
        <span class="wps-tb-divider"></span>
        <button type="button" data-action="font-plus" title="Increase Size"><i class="fa-solid fa-arrow-up-a-z"></i></button>
        <button type="button" data-action="font-minus" title="Decrease Size"><i class="fa-solid fa-arrow-down-z-a"></i></button>
      `;
      document.body.appendChild(toolbar);

      toolbar.addEventListener('mousedown', (e) => e.preventDefault());
      toolbar.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const cmd = btn.dataset.cmd;
        const action = btn.dataset.action;
        if (cmd) {
          document.execCommand(cmd, false, null);
        } else if (action === 'font-plus' && this.activeEditor) {
          const curSize = parseFloat(window.getComputedStyle(this.activeEditor).fontSize) || 14;
          this.activeEditor.style.fontSize = `${curSize + 2}px`;
        } else if (action === 'font-minus' && this.activeEditor) {
          const curSize = parseFloat(window.getComputedStyle(this.activeEditor).fontSize) || 14;
          this.activeEditor.style.fontSize = `${Math.max(8, curSize - 2)}px`;
        }
      });

      const colorInput = toolbar.querySelector('#miniTextColor');
      if (colorInput) {
        colorInput.addEventListener('input', (e) => {
          if (this.activeEditor) {
            this.activeEditor.style.color = e.target.value;
            this.activeEditor.style.setProperty('--line-text-color', e.target.value);
          }
        });
      }
    }

    this.activeEditor = lineEl;
    const rect = lineEl.getBoundingClientRect();
    toolbar.style.display = 'flex';
    toolbar.style.position = 'fixed';
    toolbar.style.top = `${Math.max(10, rect.top - 44)}px`;
    toolbar.style.left = `${Math.max(10, rect.left)}px`;
    toolbar.style.zIndex = '9999';
  }

  hideMiniToolbar() {
    const toolbar = document.getElementById('wpsMiniToolbar');
    if (toolbar) toolbar.style.display = 'none';
    this.activeEditor = null;
  }

  syncToolbar(line) {
    try {
      const fontSelect = document.getElementById('fontName');
      if (fontSelect && line.fontMeta.matchedSelect) {
        fontSelect.value = line.fontMeta.matchedSelect;
      }
      const sizeInput = document.getElementById('fontSize');
      if (sizeInput) {
        sizeInput.value = Math.round(line.fontSize * 72 / 96);
      }
      const btnBold = document.getElementById('btn-bold');
      if (btnBold) btnBold.classList.toggle('active', line.fontMeta.isBold);
      const btnItalic = document.getElementById('btn-italic');
      if (btnItalic) btnItalic.classList.toggle('active', line.fontMeta.isItalic);
    } catch (e) {}
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.renderedPages.clear();
    this.pageElements = [];
    this.pageViewports = [];
    this.pageTextData.clear();
    this.hideMiniToolbar();
  }
}

if (typeof window !== 'undefined') window.WpsPdfEngine = WpsPdfEngine;
if (typeof module !== 'undefined' && module.exports) module.exports = WpsPdfEngine;
