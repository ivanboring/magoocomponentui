/**
 * Testimonial slider — prev/next cycle the active slide.
 */
export default function init(root, props) {
  const slides = Array.from(root.querySelectorAll(".testimonial-slider__slide"));
  const prev = root.querySelector(".testimonial-slider__prev");
  const next = root.querySelector(".testimonial-slider__next");
  if (!slides.length) return () => {};
  let index = Math.max(0, slides.findIndex((s) => s.dataset.active === "true"));

  function show(i) {
    index = (i + slides.length) % slides.length;
    slides.forEach((s, n) => { s.dataset.active = String(n === index); });
    root.dispatchEvent(new CustomEvent("testimonial:change", { bubbles: true, detail: { index } }));
  }
  const onPrev = () => show(index - 1);
  const onNext = () => show(index + 1);
  prev?.addEventListener("click", onPrev);
  next?.addEventListener("click", onNext);
  return () => {
    prev?.removeEventListener("click", onPrev);
    next?.removeEventListener("click", onNext);
  };
}
