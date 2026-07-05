/**
 * Follow button — toggles follow state, swaps the label, and emits follow:toggle.
 */
export default function init(root, props) {
  const btn = root.querySelector(".follow-button__btn");
  if (!btn) return () => {};
  function onClick() {
    const next = btn.dataset.following !== "true";
    btn.dataset.following = String(next);
    btn.setAttribute("aria-pressed", String(next));
    btn.querySelectorAll("[data-following]").forEach((el) => { el.dataset.following = String(next); });
    root.dispatchEvent(new CustomEvent("follow:toggle", { bubbles: true, detail: { following: next } }));
  }
  btn.addEventListener("click", onClick);
  return () => btn.removeEventListener("click", onClick);
}
