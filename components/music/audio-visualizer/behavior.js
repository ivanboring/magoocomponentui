/**
 * Audio visualizer — animates bar heights with a smooth pseudo-random walk while data-animated
 * is true. Illustrative only (not driven by real audio). Respects prefers-reduced-motion.
 */
export default function init(root, props) {
  if (root.dataset.animated !== "true") return () => {};
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  const bars = Array.from(root.querySelectorAll(".audio-visualizer__bar"));
  if (!bars.length) return () => {};
  const phases = bars.map((_, i) => i * 0.7);
  let t = 0, raf;
  function frame() {
    t += 0.08;
    bars.forEach((bar, i) => {
      const h = 20 + (Math.sin(t + phases[i]) * 0.5 + 0.5) * 70;
      bar.style.height = h.toFixed(1) + "%";
    });
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}
