/**
 * Trend carousel — prev/next scroll the snap track by roughly one card width.
 */
export default function init(root, props) {
  const track = root.querySelector(".trend-carousel__track");
  const prev = root.querySelector(".trend-carousel__prev");
  const next = root.querySelector(".trend-carousel__next");
  if (!track) return () => {};
  const step = () => {
    const card = track.querySelector(".trend-carousel__look");
    return card ? card.getBoundingClientRect().width + 16 : track.clientWidth * 0.8;
  };
  const onPrev = () => track.scrollBy({ left: -step(), behavior: "smooth" });
  const onNext = () => track.scrollBy({ left: step(), behavior: "smooth" });
  prev?.addEventListener("click", onPrev);
  next?.addEventListener("click", onNext);
  return () => {
    prev?.removeEventListener("click", onPrev);
    next?.removeEventListener("click", onNext);
  };
}
