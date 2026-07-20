/**
 * Carousel coverflow — the slide whose centre is nearest the track's centre is emphasized.
 *
 * The emphasized (full-size) look is the CSS base state, so screenshots (which never run this
 * behavior) already read correctly. This init only marks the OTHER slides dimmed by setting
 * data-active="false" on them — the nearest-to-centre slide gets data-active="true".
 *   - on scroll (rAF-throttled) it recomputes which slide is centred and re-marks all slides;
 *   - the prev/next arrows scroll the neighbour of the active slide to the centre.
 * Config comes from data-* attributes (portable init passes no props object).
 */
export default function init(root) {
  const track = root.querySelector(".carousel-coverflow__track");
  if (!track) return () => {};
  const prev = root.querySelector(".carousel-coverflow__prev");
  const next = root.querySelector(".carousel-coverflow__next");
  const slides = () => Array.from(track.querySelectorAll(".carousel-coverflow__slide"));

  let activeIndex = 0;

  const centeredIndex = () => {
    const trackRect = track.getBoundingClientRect();
    const center = trackRect.left + trackRect.width / 2;
    let best = 0;
    let bestDist = Infinity;
    slides().forEach((s, i) => {
      const r = s.getBoundingClientRect();
      const dist = Math.abs(r.left + r.width / 2 - center);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    return best;
  };

  let raf = 0;
  const sync = () => {
    raf = 0;
    activeIndex = centeredIndex();
    slides().forEach((s, i) => {
      s.dataset.active = i === activeIndex ? "true" : "false";
    });
  };
  const onScroll = () => {
    if (!raf) raf = requestAnimationFrame(sync);
  };
  track.addEventListener("scroll", onScroll, { passive: true });

  const toSlide = (i) => {
    const s = slides()[i];
    if (s) s.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  };
  const goPrev = () => toSlide(Math.max(0, activeIndex - 1));
  const goNext = () => toSlide(Math.min(slides().length - 1, activeIndex + 1));
  prev?.addEventListener("click", goPrev);
  next?.addEventListener("click", goNext);

  sync();

  return () => {
    track.removeEventListener("scroll", onScroll);
    prev?.removeEventListener("click", goPrev);
    next?.removeEventListener("click", goNext);
    if (raf) cancelAnimationFrame(raf);
  };
}
