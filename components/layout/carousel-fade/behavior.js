/**
 * Carousel fade — a crossfade rotator with one slide visible at a time.
 *
 * All slides are stacked in the same grid cell and cross-faded via opacity; there is no horizontal
 * scroll. The template's base state is opacity-100 so the first slide shows with no JavaScript (and
 * in screenshots). At init we call setActive(0), which sets data-active on every slide (index 0
 * true, the rest false) so the CSS fades the inactive ones out. This behavior wires:
 *   - prev/next arrows that wrap around;
 *   - dots: click to activate a slide, with the active dot reflecting the current index;
 *   - autoplay: advance every `data-interval` seconds, pausing on hover/focus.
 * Autoplay is suppressed when data-autoplay !== "true" or the visitor prefers reduced motion.
 * Config comes from data-* attributes (portable init passes no props object).
 */
export default function init(root) {
  const slides = Array.from(root.querySelectorAll(".carousel-fade__slide"));
  if (!slides.length) return () => {};
  const prev = root.querySelector(".carousel-fade__prev");
  const next = root.querySelector(".carousel-fade__next");
  const dots = Array.from(root.querySelectorAll(".carousel-fade__dot"));

  const reduceMotion =
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wantsAutoplay = root.dataset.autoplay === "true" && !reduceMotion;
  const interval = (parseFloat(root.dataset.interval) || 6) * 1000;

  let index = 0;
  const setActive = (i) => {
    const n = slides.length;
    index = ((i % n) + n) % n;
    slides.forEach((s, k) => {
      s.dataset.active = k === index ? "true" : "false";
    });
    dots.forEach((d, k) => {
      const on = k === index;
      d.dataset.active = on ? "true" : "false";
      d.setAttribute("aria-current", on ? "true" : "false");
    });
  };

  const goPrev = () => setActive(index - 1);
  const goNext = () => setActive(index + 1);
  prev?.addEventListener("click", goPrev);
  next?.addEventListener("click", goNext);

  const dotHandlers = dots.map((dot, i) => {
    const h = () => setActive(i);
    dot.addEventListener("click", h);
    return h;
  });

  let timer = 0;
  let paused = false;
  const start = () => {
    if (!wantsAutoplay || paused || timer) return;
    timer = setInterval(goNext, interval);
  };
  const stop = () => {
    if (timer) clearInterval(timer);
    timer = 0;
  };
  const pause = () => {
    paused = true;
    stop();
  };
  const resume = () => {
    paused = false;
    start();
  };

  root.addEventListener("mouseenter", pause);
  root.addEventListener("mouseleave", resume);
  root.addEventListener("focusin", pause);
  root.addEventListener("focusout", resume);

  setActive(0);
  start();

  return () => {
    prev?.removeEventListener("click", goPrev);
    next?.removeEventListener("click", goNext);
    dots.forEach((dot, i) => dot.removeEventListener("click", dotHandlers[i]));
    root.removeEventListener("mouseenter", pause);
    root.removeEventListener("mouseleave", resume);
    root.removeEventListener("focusin", pause);
    root.removeEventListener("focusout", resume);
    stop();
  };
}
