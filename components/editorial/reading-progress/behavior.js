/**
 * Reading progress — fills a top bar as the reader scrolls through the target element
 * (or the whole document). Config via data-target (CSS selector).
 */
export default function init(root, props) {
  const bar = root.querySelector(".reading-progress__bar");
  if (!bar) return () => {};
  const selector = root.dataset.target;
  const target = selector ? document.querySelector(selector) : null;

  function pct() {
    if (target) {
      const rect = target.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) return 0;
      return Math.min(100, Math.max(0, (-rect.top / total) * 100));
    }
    const total = document.documentElement.scrollHeight - window.innerHeight;
    return total <= 0 ? 0 : Math.min(100, Math.max(0, (window.scrollY / total) * 100));
  }
  function update() {
    const p = pct();
    bar.style.transform = `scaleX(${p / 100})`;
    root.setAttribute("aria-valuenow", String(Math.round(p)));
  }
  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  return () => {
    window.removeEventListener("scroll", update);
    window.removeEventListener("resize", update);
  };
}
