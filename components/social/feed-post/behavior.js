/**
 * Feed post — like toggle adjusts its count by ±1 and emits post:like.
 */
export default function init(root, props) {
  const like = root.querySelector(".feed-post__like");
  if (!like) return () => {};
  function onClick() {
    const on = like.dataset.liked !== "true";
    like.dataset.liked = String(on);
    like.setAttribute("aria-pressed", String(on));
    like.querySelectorAll("[data-liked]").forEach((el) => { el.dataset.liked = String(on); });
    const el = like.querySelector(".feed-post__likes");
    if (el) { const n = parseInt(el.textContent.replace(/[^\d]/g, ""), 10); if (!Number.isNaN(n)) el.textContent = String(Math.max(0, n + (on ? 1 : -1))); }
    root.dispatchEvent(new CustomEvent("post:like", { bubbles: true, detail: { liked: on } }));
  }
  like.addEventListener("click", onClick);
  return () => like.removeEventListener("click", onClick);
}
