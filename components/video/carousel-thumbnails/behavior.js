/**
 * Carousel thumbnails — a thumbnail strip selects which frame the main viewer shows.
 *
 * The frames are stacked; the active one is fully opaque (opacity-100 is the CSS base state, so a
 * frame renders correctly with no JavaScript and in screenshots) and the rest are faded out via
 * data-active="false". This init wires selection: clicking a thumb (or an optional arrow) sets the
 * active index, which toggles data-active on every frame and thumb, fills the caption overlay from
 * the active frame's data-caption (hidden when empty), and scrolls the active thumb into view.
 * Config comes from data-* attributes (portable init passes no props object).
 */
export default function init(root) {
  const frames = Array.from(root.querySelectorAll(".carousel-thumbnails__frame"));
  const thumbs = Array.from(root.querySelectorAll(".carousel-thumbnails__thumb"));
  const caption = root.querySelector(".carousel-thumbnails__caption");
  const prev = root.querySelector(".carousel-thumbnails__prev");
  const next = root.querySelector(".carousel-thumbnails__next");
  if (!frames.length) return () => {};

  let active = 0;

  const setActive = (i) => {
    active = Math.max(0, Math.min(frames.length - 1, i));
    frames.forEach((f, n) => { f.dataset.active = n === active ? "true" : "false"; });
    thumbs.forEach((t, n) => { t.dataset.active = n === active ? "true" : "false"; });
    if (caption) caption.textContent = frames[active].dataset.caption || "";
    const thumb = thumbs[active];
    if (thumb) thumb.scrollIntoView({ inline: "nearest", block: "nearest" });
    if (prev) prev.disabled = active === 0;
    if (next) next.disabled = active === frames.length - 1;
  };

  const thumbHandlers = thumbs.map((thumb, i) => {
    const h = () => setActive(i);
    thumb.addEventListener("click", h);
    return h;
  });
  const goPrev = () => setActive(active - 1);
  const goNext = () => setActive(active + 1);
  prev?.addEventListener("click", goPrev);
  next?.addEventListener("click", goNext);

  setActive(0);

  return () => {
    thumbs.forEach((thumb, i) => thumb.removeEventListener("click", thumbHandlers[i]));
    prev?.removeEventListener("click", goPrev);
    next?.removeEventListener("click", goNext);
  };
}
