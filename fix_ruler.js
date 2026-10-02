function buildRuler(zoomScale) {
  const ruler = document.getElementById('ruler');
  if (!ruler) return;
  ruler.innerHTML = '';

  const scale = zoomScale || (window.currentZoom / 100) || 1;
  const samplePage = document.querySelector('#pageContainer .page, #pageContainer .wps-pdf-page');
  if (!samplePage) return;

  const pageWidthPx = samplePage.offsetWidth;
  const pageMarginStr = window.getComputedStyle(samplePage).paddingLeft;
  const marginPx = parseFloat(pageMarginStr) || (2.54 * 96 / 2.54); // default 1in ~ 96px

  ruler.style.width = pageWidthPx + 'px';
  // If the page is centered with margin auto in a flex container, the ruler must match its alignment
  // Actually, we can align the ruler to the page by keeping it in sync with the container zoom/transform
  ruler.style.transform = samplePage.style.transform;
  ruler.style.transformOrigin = 'top center';
  
  // Actually the .page-container has centering. The ruler-wrapper should be centered.
  const rulerWrapper = ruler.parentElement;
  rulerWrapper.style.display = 'flex';
  rulerWrapper.style.justifyContent = 'center';
  
  const pageWidthCm = 21; // roughly 21 for A4
  const pxPerCm = pageWidthPx / pageWidthCm;
  const contentWidthPx = pageWidthPx - (marginPx * 2);

  // Content area background (white region)
  const contentBg = document.createElement('div');
  contentBg.className = 'ruler-content-bg';
  contentBg.style.left = marginPx + 'px';
  contentBg.style.width = contentWidthPx + 'px';
  ruler.appendChild(contentBg);

  const stepCm = 0.5;
  const stepPx = stepCm * pxPerCm;
  const totalSteps = Math.ceil(pageWidthCm / stepCm) + 2;

  for (let i = 0; i <= totalSteps; i++) {
    const xPx = i * stepPx;
    if (xPx > pageWidthPx) continue;

    const isMain = (i % 2 === 0);
    const tick = document.createElement('div');
    tick.className = 'ruler-tick';
    tick.style.left = xPx + 'px';
    tick.style.height = isMain ? '8px' : '4px';
    if (!isMain) tick.style.background = '#a19f9d';
    ruler.appendChild(tick);

    if (isMain) {
      // 0 is at left margin.
      const posFromMarginStart = (xPx - marginPx) / pxPerCm;
      const label = document.createElement('div');
      label.className = 'ruler-label';
      label.style.left = xPx + 'px';
      
      const val = Math.round(posFromMarginStart);
      // only label if it fits nicely inside
      if (Math.abs(posFromMarginStart) < 0.1) {
        label.textContent = '0';
        ruler.appendChild(label);
      } else if (val >= 1 && val < Math.floor(contentWidthPx/pxPerCm)+1 && Math.abs(posFromMarginStart - val) < 0.1) {
        label.textContent = val.toString();
        ruler.appendChild(label);
      }
    }
  }
}

window.buildRuler = buildRuler;
