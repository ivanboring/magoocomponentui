/**
 * Image lightbox — prev/next cycle through images, Escape/close dismiss, arrow keys
 * navigate. The first image is shown on init.
 */
export default function init(root, props) {
  const images = Array.from(root.querySelectorAll(".image-lightbox__image"));
  const caption = root.querySelector("[data-lightbox-caption]");
  if (!images.length) return () => {};
  let index = 0;

  function show(i) {
    index = (i + images.length) % images.length;
    images.forEach((img, n) => { img.dataset.active = String(n === index); });
    if (caption) caption.textContent = images[index].getAttribute("alt") || "";
  }
  function close() {
    root.dataset.open = "false";
    root.dispatchEvent(new CustomEvent("image-lightbox:close", { bubbles: true }));
  }
  function onClick(event) {
    if (event.target.closest("[data-lightbox-close]")) return close();
    if (event.target.closest("[data-lightbox-prev]")) return show(index - 1);
    if (event.target.closest("[data-lightbox-next]")) return show(index + 1);
    if (event.target === root) close();
  }
  function onKey(event) {
    if (root.dataset.open === "false") return;
    if (event.key === "Escape") close();
    else if (event.key === "ArrowLeft") show(index - 1);
    else if (event.key === "ArrowRight") show(index + 1);
  }

  show(0);
  root.addEventListener("click", onClick);
  document.addEventListener("keydown", onKey);
  return () => {
    root.removeEventListener("click", onClick);
    document.removeEventListener("keydown", onKey);
  };
}
