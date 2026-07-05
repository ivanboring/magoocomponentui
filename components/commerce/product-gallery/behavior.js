/**
 * Product gallery — clicking a thumbnail shows the matching main image (matched by index).
 */
export default function init(root, props) {
  const thumbs = Array.from(root.querySelectorAll(".product-gallery__thumb"));
  const mains = Array.from(root.querySelectorAll(".product-gallery__main"));
  if (!thumbs.length) return () => {};

  function select(i) {
    thumbs.forEach((t, n) => { t.dataset.active = String(n === i); t.setAttribute("aria-selected", String(n === i)); });
    mains.forEach((m, n) => { m.dataset.active = String(n === i); });
  }
  function onClick(event) {
    const thumb = event.target.closest(".product-gallery__thumb");
    if (thumb) select(thumbs.indexOf(thumb));
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}
