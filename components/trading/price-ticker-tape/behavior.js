/**
 * Price ticker tape — a continuously scrolling horizontal loop of market quotes driven by
 * requestAnimationFrame.
 *
 * Components ship no CSS, so the scroll can't be a @keyframes — this behavior translates the track
 * each frame and wraps the offset by the width of the FIRST .price-ticker-tape__group. The quote
 * list is rendered twice in the template (two identical groups) so that as one group scrolls out
 * the second fills the gap, making the loop seamless.
 *
 * Config comes from data-* attributes (portable init passes no props object):
 *   - data-speed: slow | normal | fast  -> per-frame pixel step
 *
 * Pauses while the tape is hovered or contains focus, and does not animate at all when the user
 * prefers reduced motion.
 */
export default function init(root) {
  const track = root.querySelector(".price-ticker-tape__track");
  const firstGroup = root.querySelector(".price-ticker-tape__group");
  if (!track || !firstGroup) return () => {};

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const SPEEDS = { slow: 0.3, normal: 0.6, fast: 1.1 };
  const pxPerFrame = SPEEDS[root.dataset.speed] || SPEEDS.normal;

  let groupWidth = firstGroup.scrollWidth;
  let offset = 0;
  let paused = false;
  let raf = 0;

  const measure = () => {
    groupWidth = firstGroup.scrollWidth || groupWidth;
  };

  const apply = () => {
    const mod = groupWidth ? ((offset % groupWidth) + groupWidth) % groupWidth : 0;
    track.style.transform = "translateX(" + -mod + "px)";
  };

  const frame = () => {
    if (!paused) {
      offset += pxPerFrame;
      apply();
    }
    raf = requestAnimationFrame(frame);
  };

  const start = () => {
    if (!raf && !reduce.matches) raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  const onEnter = () => { paused = true; };
  const onLeave = () => { paused = false; };
  const onResize = () => { measure(); apply(); };
  const onMotionChange = () => {
    if (reduce.matches) {
      stop();
      track.style.transform = "";
    } else {
      start();
    }
  };

  root.addEventListener("mouseenter", onEnter);
  root.addEventListener("mouseleave", onLeave);
  root.addEventListener("focusin", onEnter);
  root.addEventListener("focusout", onLeave);
  window.addEventListener("resize", onResize);
  if (reduce.addEventListener) reduce.addEventListener("change", onMotionChange);

  apply();
  start();

  return () => {
    stop();
    root.removeEventListener("mouseenter", onEnter);
    root.removeEventListener("mouseleave", onLeave);
    root.removeEventListener("focusin", onEnter);
    root.removeEventListener("focusout", onLeave);
    window.removeEventListener("resize", onResize);
    if (reduce.removeEventListener) reduce.removeEventListener("change", onMotionChange);
    track.style.transform = "";
  };
}
