/**
 * Reading percent — a fixed badge showing how far the reader is through an article, measured
 * between a start and a finish element (CSS selectors on data-start / data-finish). It reads
 * 0% until the top of the start element reaches the top of the viewport, and 100% once the
 * bottom of the finish element reaches the bottom of the viewport. Missing selectors fall back
 * to the top / bottom of the document, so it degrades to whole-page progress.
 */
const R = 16;
const CIRC = 2 * Math.PI * R; // circumference for the ring's r=16, matches the template

export default function init(root, props) {
  const arc = root.querySelector(".reading-percent__arc");
  const value = root.querySelector(".reading-percent__value");
  const startSel = root.dataset.start || "";
  const finishSel = root.dataset.finish || "";

  // Absolute Y range (document coordinates) the reader travels through the article.
  function range() {
    const startEl = startSel ? document.querySelector(startSel) : null;
    const finishEl = finishSel ? document.querySelector(finishSel) : null;
    const startTop = startEl ? startEl.getBoundingClientRect().top + window.scrollY : 0;
    const finishBottom = finishEl
      ? finishEl.getBoundingClientRect().bottom + window.scrollY
      : document.documentElement.scrollHeight;
    // scrollY at which the finish's bottom sits on the viewport bottom = fully read.
    return { startTop, end: finishBottom - window.innerHeight };
  }
  function pct() {
    const { startTop, end } = range();
    const span = end - startTop;
    if (span <= 0) return window.scrollY >= startTop ? 100 : 0;
    return Math.min(100, Math.max(0, ((window.scrollY - startTop) / span) * 100));
  }
  function update() {
    const p = Math.round(pct());
    if (arc) arc.style.strokeDashoffset = String(CIRC * (1 - p / 100));
    if (value) value.textContent = p + "%";
    root.setAttribute("aria-valuenow", String(p));
  }

  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  return () => {
    window.removeEventListener("scroll", update);
    window.removeEventListener("resize", update);
  };
}
