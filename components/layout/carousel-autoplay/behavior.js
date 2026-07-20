/**
 * Carousel autoplay — a single-slide rotator over a snap track.
 *
 * The slides live in a horizontally scrolling snap track (one slide === one track width), so the
 * default no-JS state already shows the first slide. This behavior wires:
 *   - autoplay: advance one slide every `data-interval` seconds, wrapping to 0 after the last;
 *   - pause on hover/focus (mouseenter/focusin) and resume on mouseleave/focusout;
 *   - prev/next arrows that wrap around;
 *   - dots: click to scroll to a slide, and the active dot tracks the scroll position;
 *   - a progress bar that fills 0->100% over the interval for the current slide, resetting on
 *     change and freezing while paused.
 * Autoplay is suppressed when data-autoplay !== "true" or the visitor prefers reduced motion.
 * Config comes from data-* attributes (portable init passes no props object).
 */
export default function init(root) {
  const track = root.querySelector(".carousel-autoplay__track");
  if (!track) return () => {};
  const prev = root.querySelector(".carousel-autoplay__prev");
  const next = root.querySelector(".carousel-autoplay__next");
  const bar = root.querySelector(".carousel-autoplay__bar");
  const dots = Array.from(root.querySelectorAll(".carousel-autoplay__dot"));

  const reduceMotion =
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wantsAutoplay = root.dataset.autoplay === "true" && !reduceMotion;
  const interval = (parseFloat(root.dataset.interval) || 6) * 1000;

  const count = () => Math.max(1, Math.round(track.scrollWidth / track.clientWidth));
  const currentIndex = () =>
    Math.min(count() - 1, Math.round(track.scrollLeft / track.clientWidth));

  const toSlide = (i) => {
    const n = count();
    const idx = ((i % n) + n) % n;
    track.scrollTo({ left: idx * track.clientWidth, behavior: "smooth" });
  };
  const goPrev = () => toSlide(currentIndex() - 1);
  const goNext = () => toSlide(currentIndex() + 1);
  prev?.addEventListener("click", goPrev);
  next?.addEventListener("click", goNext);

  const dotHandlers = dots.map((dot, i) => {
    const h = () => toSlide(i);
    dot.addEventListener("click", h);
    return h;
  });

  // Progress bar: reset to 0 with no transition, then next frame animate to 100% over interval.
  let barRaf = 0;
  const resetBar = () => {
    if (!bar) return;
    if (barRaf) cancelAnimationFrame(barRaf);
    bar.style.transition = "none";
    bar.style.width = "0%";
    if (!wantsAutoplay || paused) return;
    barRaf = requestAnimationFrame(() => {
      barRaf = requestAnimationFrame(() => {
        bar.style.transition = `width ${interval}ms linear`;
        bar.style.width = "100%";
      });
    });
  };
  const freezeBar = () => {
    if (!bar) return;
    if (barRaf) cancelAnimationFrame(barRaf);
    const w = getComputedStyle(bar).width;
    bar.style.transition = "none";
    bar.style.width = w;
  };

  let raf = 0;
  const sync = () => {
    raf = 0;
    if (!dots.length) return;
    const active = currentIndex();
    dots.forEach((d, i) => {
      const on = i === active;
      d.dataset.active = on ? "true" : "false";
      d.setAttribute("aria-current", on ? "true" : "false");
    });
  };
  const onScroll = () => {
    if (!raf) raf = requestAnimationFrame(sync);
  };
  track.addEventListener("scroll", onScroll, { passive: true });
  sync();

  // Autoplay timer + pause state.
  let timer = 0;
  let paused = false;
  const tick = () => goNext();
  const start = () => {
    if (!wantsAutoplay || paused || timer) return;
    timer = setInterval(tick, interval);
    resetBar();
  };
  const stop = () => {
    if (timer) clearInterval(timer);
    timer = 0;
  };
  const pause = () => {
    if (paused) return;
    paused = true;
    stop();
    freezeBar();
  };
  const resume = () => {
    if (!paused) return;
    paused = false;
    start();
    resetBar();
  };

  root.addEventListener("mouseenter", pause);
  root.addEventListener("mouseleave", resume);
  root.addEventListener("focusin", pause);
  root.addEventListener("focusout", resume);

  // Restart the fill when a slide change lands (scroll settles) during autoplay.
  let settleTimer = 0;
  const onSettle = () => {
    if (settleTimer) clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      if (wantsAutoplay && !paused && timer) resetBar();
    }, 120);
  };
  track.addEventListener("scroll", onSettle, { passive: true });

  start();

  return () => {
    prev?.removeEventListener("click", goPrev);
    next?.removeEventListener("click", goNext);
    dots.forEach((dot, i) => dot.removeEventListener("click", dotHandlers[i]));
    track.removeEventListener("scroll", onScroll);
    track.removeEventListener("scroll", onSettle);
    root.removeEventListener("mouseenter", pause);
    root.removeEventListener("mouseleave", resume);
    root.removeEventListener("focusin", pause);
    root.removeEventListener("focusout", resume);
    stop();
    if (raf) cancelAnimationFrame(raf);
    if (barRaf) cancelAnimationFrame(barRaf);
    if (settleTimer) clearTimeout(settleTimer);
  };
}
