// ==========================================
// SECTION 2: PAGE ADD / DELETE / DUPLICATE / ROTATE / REORDER
// ==========================================
(function() {
  const pc = document.getElementById('pageContainer');
  if (!pc) return;

  // Make pages have a fixed height for overflow calculation
  const style = document.createElement('style');
  style.innerHTML = `
    .page { height: var(--page-height); min-height: unset; overflow: hidden; }
    .page-separator-btn {
      position: absolute; left: 50%; bottom: -12px; transform: translateX(-50%);
      width: 24px; height: 24px; background: #185abd; color: #fff;
      border-radius: 50%; display: none; align-items: center; justify-content: center;
      cursor: pointer; z-index: 100; box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
    .page:hover .page-separator-btn { display: flex; }
    .thumbnail-context-menu {
      position: fixed; background: #fff; border: 1px solid #ccc;
      box-shadow: 2px 2px 8px rgba(0,0,0,0.2); z-index: 3000;
      padding: 5px 0; border-radius: 4px; display: none; min-width: 160px;
    }
    .thumbnail-context-menu div {
      padding: 8px 15px; cursor: pointer; font-size: 13px; color: #333;
    }
    .thumbnail-context-menu div:hover { background: #f0f0f0; }
  `;
  document.head.appendChild(style);

  // Auto Paginate Logic (Moves overflowing content to next page)
  function autoPaginate() {
    const pages = Array.from(pc.querySelectorAll('.page'));
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      
      // If content overflows
      if (page.scrollHeight > page.clientHeight) {
        // We need a next page
        let nextPage = pages[i + 1];
        if (!nextPage) {
          nextPage = createBlankPage();
          page.insertAdjacentElement('afterend', nextPage);
          pages.push(nextPage);
          if (window.buildThumbnails) window.buildThumbnails();
          if (window.updateStats) window.updateStats();
        }
        
        // Move last element to next page
        // (Basic approach: move the last block element)
        const children = Array.from(page.childNodes);
        let moved = false;
        for (let j = children.length - 1; j >= 0; j--) {
          const child = children[j];
          if (child.nodeType === 1 && child.tagName !== 'BR' && !child.classList?.contains('annotation-layer')) {
            nextPage.insertBefore(child, nextPage.firstChild);
            moved = true;
            break; // Move one block and re-check
          }
        }
        
        // If we couldn't move cleanly (e.g. huge text block), force split (advanced) - for now just move it.
        // After moving, re-evaluate this page
        if (moved) i--; 
      }
      
      // If page is empty (and not the only page)
      if (pages.length > 1) {
        const textContent = page.innerText.trim();
        const hasGraphics = page.querySelector('img, canvas, svg:not(:empty)');
        if (!textContent && !hasGraphics && page.scrollHeight <= page.clientHeight + 10) {
          // It's empty, but check if it's the trailing page
          if (i === pages.length - 1) {
             page.remove();
             pages.pop();
             if (window.buildThumbnails) window.buildThumbnails();
          }
        }
      }
    }
  }

  // Bind autoPaginate to input events
  pc.addEventListener('input', autoPaginate);

  // Add "+" button between pages
  function addPageSeparators() {
    const pages = pc.querySelectorAll('.page');
    pages.forEach((p, idx) => {
      let btn = p.querySelector('.page-separator-btn');
      if (!btn) {
        btn = document.createElement('div');
        btn.className = 'page-separator-btn';
        btn.innerHTML = '<i class="fa-solid fa-plus"></i>';
        btn.title = 'Insert Blank Page';
        btn.onclick = (e) => {
          e.stopPropagation();
          const newP = createBlankPage();
          p.insertAdjacentElement('afterend', newP);
          if (window.buildThumbnails) window.buildThumbnails();
        };
        p.appendChild(btn);
      }
    });
  }
  
  // Call it initially and on page changes
  const origBuildThumb = window.buildThumbnails;
  window.buildThumbnails = function() {
    if (origBuildThumb) origBuildThumb.call(window);
    addPageSeparators();
  };
  
  function createBlankPage() {
    const page = document.createElement('div');
    page.className = 'page';
    page.contentEditable = 'true';
    page.spellcheck = window.spellcheckEnabled || false;
    page.innerHTML = '<p style="font-family: Calibri, sans-serif; font-size: 11pt; text-align: left; color: #000000; margin-top: 0; margin-bottom: 6pt;"><br></p>';
    return page;
  }

  // Override Duplicate and Delete to ask confirmation and support undo (conceptually)
  window.pageTools.deleteActivePage = function(targetPage) {
    const page = targetPage || window.pageTools.getActivePage();
    if (!page) return;
    const pages = Array.from(pc.querySelectorAll('.page'));
    if (pages.length <= 1) {
      alert("Cannot delete the only page in the document.");
      return;
    }
    const hasContent = page.innerText.trim().length > 0 || page.querySelector('img, canvas');
    if (hasContent && !confirm("This page has content. Are you sure you want to delete it?")) {
      return;
    }
    
    // Store in undo stack (simulated)
    const clone = page.cloneNode(true);
    page.remove();
    
    if (window.buildThumbnails) window.buildThumbnails();
    if (window.updateStats) window.updateStats();
  };

  // Thumbnail Context Menu
  const tcm = document.createElement('div');
  tcm.className = 'thumbnail-context-menu';
  tcm.innerHTML = `
    <div id="tcm-insert-before"><i class="fa-solid fa-file-circle-plus"></i> Insert Blank Before</div>
    <div id="tcm-insert-after"><i class="fa-solid fa-file-circle-plus"></i> Insert Blank After</div>
    <div id="tcm-duplicate"><i class="fa-regular fa-copy"></i> Duplicate Page</div>
    <div id="tcm-rotate"><i class="fa-solid fa-rotate-right"></i> Rotate 90&deg;</div>
    <div id="tcm-delete" style="color:#d13438;"><i class="fa-solid fa-trash-can"></i> Delete Page</div>
  `;
  document.body.appendChild(tcm);

  let contextPageIdx = -1;

  document.getElementById('thumbnailContainer').addEventListener('contextmenu', (e) => {
    const card = e.target.closest('.thumb-card');
    if (!card) return;
    e.preventDefault();
    contextPageIdx = parseInt(card.dataset.pageIdx || Array.from(card.parentNode.children).indexOf(card), 10);
    
    tcm.style.display = 'block';
    tcm.style.left = e.clientX + 'px';
    tcm.style.top = e.clientY + 'px';
  });

  document.addEventListener('click', () => { tcm.style.display = 'none'; });

  tcm.querySelector('#tcm-insert-before').onclick = () => {
    const pages = pc.querySelectorAll('.page');
    if (pages[contextPageIdx]) {
      pages[contextPageIdx].insertAdjacentElement('beforebegin', createBlankPage());
      if (window.buildThumbnails) window.buildThumbnails();
    }
  };
  tcm.querySelector('#tcm-insert-after').onclick = () => {
    const pages = pc.querySelectorAll('.page');
    if (pages[contextPageIdx]) {
      pages[contextPageIdx].insertAdjacentElement('afterend', createBlankPage());
      if (window.buildThumbnails) window.buildThumbnails();
    }
  };
  tcm.querySelector('#tcm-duplicate').onclick = () => {
    const pages = pc.querySelectorAll('.page');
    if (pages[contextPageIdx]) {
      const clone = pages[contextPageIdx].cloneNode(true);
      clone.id = '';
      pages[contextPageIdx].insertAdjacentElement('afterend', clone);
      if (window.buildThumbnails) window.buildThumbnails();
    }
  };
  tcm.querySelector('#tcm-delete').onclick = () => {
    const pages = pc.querySelectorAll('.page');
    if (pages[contextPageIdx]) {
      window.pageTools.deleteActivePage(pages[contextPageIdx]);
    }
  };
  tcm.querySelector('#tcm-rotate').onclick = () => {
    const pages = pc.querySelectorAll('.page');
    if (pages[contextPageIdx]) {
      const page = pages[contextPageIdx];
      const currentTransform = page.style.transform || '';
      let currentAngle = 0;
      const match = currentTransform.match(/rotate\(([-\d.]+)deg\)/);
      if (match) currentAngle = parseInt(match[1], 10);
      page.style.transform = `rotate(${(currentAngle + 90) % 360}deg)`;
      page.style.transformOrigin = 'center center';
      if (window.buildThumbnails) setTimeout(window.buildThumbnails, 100);
    }
  };

})();
