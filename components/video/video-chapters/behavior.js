/**
 * Video chapters — clicking a chapter emits chapters:seek with its start seconds and
 * marks it active.
 */
export default function init(root, props) {
  function onClick(event) {
    const item = event.target.closest(".video-chapters__item");
    if (!item) return;
    root.querySelectorAll(".video-chapters__item").forEach((c) => {
      const on = c === item;
      c.dataset.active = String(on);
      c.setAttribute("aria-current", String(on));
    });
    root.dispatchEvent(new CustomEvent("chapters:seek", { bubbles: true, detail: { seconds: Number(item.dataset.seconds) } }));
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}
