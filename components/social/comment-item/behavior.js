/**
 * Comment item — like toggle adjusts the count by ±1 and emits comment:like.
 */
export default function init(root, props) {
  const like = root.querySelector(".comment-item__like");
  if (!like) return () => {};
  function onClick() {
    const on = like.dataset.liked !== "true";
    like.dataset.liked = String(on);
    like.setAttribute("aria-pressed", String(on));
    like.querySelectorAll("[data-liked]").forEach((el) => { el.dataset.liked = String(on); });
    const el = like.querySelector(".comment-item__likes");
    if (el) { const n = parseInt(el.textContent, 10); if (!Number.isNaN(n)) el.textContent = String(Math.max(0, n + (on ? 1 : -1))); }
    root.dispatchEvent(new CustomEvent("comment:like", { bubbles: true, detail: { liked: on } }));
  }
  like.addEventListener("click", onClick);
  return () => like.removeEventListener("click", onClick);
}
