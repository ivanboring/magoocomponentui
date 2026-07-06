/**
 * Conversion funnel report — opt-in reveal animation.
 *
 * Only active when the component is rendered with `animate_on_display` (data-animate="true").
 * The bars start collapsed at 0 and grow to their target width over 0.5s the first time the
 * report scrolls into view. Without JS (or with animate off) the bars keep their inline
 * width, so the final state always renders. Respects prefers-reduced-motion.
 */
export default function init(root, props) {
  if (root.dataset.animate !== "true") return () => {};
  const bars = [...root.querySelectorAll(".conversion-funnel-report__bar")];
  if (!bars.length) return () => {};
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Capture targets, then collapse to 0 with no transition so there's no flash of the
  // final width before the animation runs.
  const targets = bars.map((b) => b.dataset.width || "0");
  bars.forEach((b) => { b.style.transition = "none"; b.style.width = "0%"; });
  void root.offsetWidth; // commit the 0 width before enabling the transition

  function reveal() {
    bars.forEach((b, i) => {
      b.style.transition = reduce ? "none" : "width 0.5s ease-out";
      b.style.width = targets[i] + "%";
    });
  }

  let io = null;
  if (reduce || !("IntersectionObserver" in window)) {
    reveal();
  } else {
    io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { reveal(); io.disconnect(); io = null; break; }
      }
    }, { threshold: 0.25 });
    io.observe(root);
  }
  return () => { io?.disconnect(); };
}
