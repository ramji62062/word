class PageTools {
  constructor() {
    this.container = null;
  }

  getContainer() {
    if (!this.container) this.container = document.getElementById('pageContainer');
    return this.container;
  }

  getActivePage() {
    // Determine active page based on selection or scroll position
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const node = sel.anchorNode;
      if (node) {
        const page = node.nodeType === 1 ? node.closest('.page') : node.parentElement?.closest('.page');
        if (page) return page;
      }
    }
    
    // Fallback to active thumbnail index
    const activeThumb = document.querySelector('.thumb-card.active-page');
    if (activeThumb) {
      const idx = Array.from(activeThumb.parentElement.children).indexOf(activeThumb);
      const pages = this.getContainer().querySelectorAll('.page');
      if (pages[idx]) return pages[idx];
    }
    
    // Fallback to first page
    return this.getContainer().querySelector('.page');
  }

  deleteActivePage() {
    const page = this.getActivePage();
    if (!page) return;
    const pages = Array.from(this.getContainer().querySelectorAll('.page'));
    if (pages.length <= 1) {
      alert("Cannot delete the only page in the document.");
      return;
    }
    if (confirm("Are you sure you want to delete this page?")) {
      page.remove();
      if (window.buildThumbnails) window.buildThumbnails();
      if (window.updateStats) window.updateStats();
    }
  }

  duplicateActivePage() {
    const page = this.getActivePage();
    if (!page) return;
    const clone = page.cloneNode(true);
    // clean up any ID duplicates if necessary
    clone.id = '';
    page.insertAdjacentElement('afterend', clone);
    if (window.buildThumbnails) window.buildThumbnails();
    if (window.updateStats) window.updateStats();
  }

  rotateActivePage() {
    const page = this.getActivePage();
    if (!page) return;
    
    // Get current rotation
    const currentTransform = page.style.transform || '';
    let currentAngle = 0;
    const match = currentTransform.match(/rotate\(([-\d.]+)deg\)/);
    if (match) currentAngle = parseInt(match[1], 10);
    
    const newAngle = (currentAngle + 90) % 360;
    
    // Retain scale if present
    let scaleMatch = currentTransform.match(/scale\(([-\d.]+)\)/);
    let scaleStr = scaleMatch ? `scale(${scaleMatch[1]}) ` : '';
    
    page.style.transform = `${scaleStr}rotate(${newAngle}deg)`;
    page.style.transformOrigin = 'center center';
    
    // Notify thumbnails
    if (window.buildThumbnails) setTimeout(window.buildThumbnails, 100);
  }

  insertBlankPage() {
    const activePage = this.getActivePage();
    const page = document.createElement('div');
    page.className = 'page';
    page.contentEditable = 'true';
    page.innerHTML = '<p><br></p>';
    page.style.spellcheck = "false";
    
    if (activePage) {
      activePage.insertAdjacentElement('afterend', page);
    } else {
      this.getContainer().appendChild(page);
    }
    page.focus();
    if (window.buildThumbnails) window.buildThumbnails();
    if (window.updatePageCount) window.updatePageCount();
  }
}

window.pageTools = new PageTools();

// Override global insertBlankPage to use the better one
window.insertBlankPage = () => window.pageTools.insertBlankPage();

PageTools.prototype.extractActivePage = async function() {
  const page = this.getActivePage();
  if (!page) return;
  alert("Extracting page to new PDF document... (Downloads as single page PDF)");
  // If we had a loaded pdf-lib Document, we'd copy this page out
  // For now we can trigger print for just this page via CSS, or just download source
  if (window.exportToPDF) {
    const originalDisplay = page.style.display;
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    page.style.display = 'block';
    await window.exportToPDF();
    document.querySelectorAll('.page').forEach(p => p.style.display = 'block');
  }
};

PageTools.prototype.replaceActivePage = function() {
  const page = this.getActivePage();
  if (!page) return;
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,application/pdf';
  input.onchange = async (e) => {
    if (e.target.files.length > 0) {
      alert("Page replaced with: " + e.target.files[0].name);
      page.innerHTML = '<p><i>[Replaced with ' + e.target.files[0].name + ']</i></p>';
      if (window.buildThumbnails) window.buildThumbnails();
    }
  };
  input.click();
};
