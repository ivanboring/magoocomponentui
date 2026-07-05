/**
 * Card slider — prev/next scroll the track by roughly one viewport of cards.
 */
export default function init(root, props) {
  const track = root.querySelector(".card-slider__track");
  const prev = root.querySelector(".card-slider__prev");
  const next = root.querySelector(".card-slider__next");
  if (!track) return () => {};
  const step = () => Math.max(240, track.clientWidth * 0.8);
  const onPrev = () => track.scrollBy({ left: -step(), behavior: "smooth" });
  const onNext = () => track.scrollBy({ left: step(), behavior: "smooth" });
  prev?.addEventListener("click", onPrev);
  next?.addEventListener("click", onNext);
  return () => {
    prev?.removeEventListener("click", onPrev);
    next?.removeEventListener("click", onNext);
  };
}
