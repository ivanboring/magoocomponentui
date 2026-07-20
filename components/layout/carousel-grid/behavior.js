/**
 * Carousel grid — arrows, pager dots, and optional looping over a snap track.
 *
 * Layout (cards-in-view per breakpoint, peek, gap, and the last-card end alignment) is pure CSS
 * driven by the --cc-* custom properties on the track; this behavior only wires interaction:
 *   - prev/next scroll by one "page" (the current cards-in-view count) and disable at the ends
 *     unless data-loop="true", in which case they wrap around;
 *   - pager dots scroll to their card and track the active card on scroll.
 * Config comes from data-* attributes (portable init passes no props object).
 */
export default function init(root) {
  const track = root.querySelector(".carousel-grid__track");
  if (!track) return () => {};
  const prev = root.querySelector(".carousel-grid__prev");
  const next = root.querySelector(".carousel-grid__next");
  const dots = Array.from(root.querySelectorAll(".carousel-grid__dot"));
  const loop = root.dataset.loop === "true";

  const cs = () => getComputedStyle(track);
  const gap = () => parseFloat(cs().columnGap) || 0;
  const scrollPad = () => parseFloat(cs().scrollPaddingLeft) || 0;
  const slides = () => Array.from(track.querySelectorAll(".carousel-grid__slide"));
  const cols = () => Math.max(1, parseInt(cs().getPropertyValue("--cc-cols"), 10) || 1);
  const cardStride = () => {
    const s = slides()[0];
    return s ? s.getBoundingClientRect().width + gap() : track.clientWidth * 0.8;
  };
  const maxScroll = () => track.scrollWidth - track.clientWidth;
  const atStart = () => track.scrollLeft <= 1;
  const atEnd = () => track.scrollLeft >= maxScroll() - 1;

  const goPrev = () => {
    if (loop && atStart()) return track.scrollTo({ left: maxScroll(), behavior: "smooth" });
    track.scrollBy({ left: -cardStride() * cols(), behavior: "smooth" });
  };
  const goNext = () => {
    if (loop && atEnd()) return track.scrollTo({ left: 0, behavior: "smooth" });
    track.scrollBy({ left: cardStride() * cols(), behavior: "smooth" });
  };
  prev?.addEventListener("click", goPrev);
  next?.addEventListener("click", goNext);

  const toCard = (i) => {
    const s = slides()[i];
    if (s) track.scrollTo({ left: Math.max(0, s.offsetLeft - scrollPad()), behavior: "smooth" });
  };
  const dotHandlers = dots.map((dot, i) => {
    const h = () => toCard(i);
    dot.addEventListener("click", h);
    return h;
  });

  let raf = 0;
  const sync = () => {
    raf = 0;
    if (dots.length) {
      const active = Math.min(dots.length - 1, Math.round(track.scrollLeft / cardStride()));
      dots.forEach((d, i) => {
        const on = i === active;
        d.dataset.active = on ? "true" : "false";
        d.setAttribute("aria-current", on ? "true" : "false");
      });
    }
    if (!loop) {
      if (prev) prev.disabled = atStart();
      if (next) next.disabled = atEnd();
    }
  };
  const onScroll = () => {
    if (!raf) raf = requestAnimationFrame(sync);
  };
  track.addEventListener("scroll", onScroll, { passive: true });
  sync();

  return () => {
    prev?.removeEventListener("click", goPrev);
    next?.removeEventListener("click", goNext);
    dots.forEach((dot, i) => dot.removeEventListener("click", dotHandlers[i]));
    track.removeEventListener("scroll", onScroll);
    if (raf) cancelAnimationFrame(raf);
  };
}
