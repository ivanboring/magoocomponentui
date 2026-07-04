/**
 * Back-to-top — reveals past a scroll threshold, smooth-scrolls to top on click.
 * Threshold comes from data-threshold (portable init passes no props).
 */
export default function init(root, props) {
  const threshold = Number(root.dataset.threshold) || 300;

  function onScroll() {
    const visible = window.scrollY > threshold;
    root.dataset.visible = String(visible);
    root.toggleAttribute("hidden", !visible);
  }
  function onClick() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  root.addEventListener("click", onClick);
  return () => {
    window.removeEventListener("scroll", onScroll);
    root.removeEventListener("click", onClick);
  };
}
