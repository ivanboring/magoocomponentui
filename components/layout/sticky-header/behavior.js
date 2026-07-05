/**
 * Sticky header — adds a shadow (data-scrolled) once the page is scrolled past the top.
 */
export default function init(root, props) {
  function onScroll() { root.dataset.scrolled = String(window.scrollY > 4); }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}
