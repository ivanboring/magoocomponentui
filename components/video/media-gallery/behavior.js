/**
 * Media gallery — clicking a thumbnail shows the matching main image and marks the
 * thumbnail active. Matches by index between thumbs and main images.
 */
export default function init(root, props) {
  const thumbs = Array.from(root.querySelectorAll(".media-gallery__thumb"));
  const mains = Array.from(root.querySelectorAll(".media-gallery__main"));
  if (!thumbs.length) return () => {};

  function select(index) {
    thumbs.forEach((t, i) => {
      t.dataset.active = String(i === index);
      t.setAttribute("aria-selected", String(i === index));
    });
    mains.forEach((m, i) => { m.dataset.active = String(i === index); });
    root.dispatchEvent(new CustomEvent("media-gallery:change", { bubbles: true, detail: { index } }));
  }
  function onClick(event) {
    const thumb = event.target.closest(".media-gallery__thumb");
    if (thumb) select(thumbs.indexOf(thumb));
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}
