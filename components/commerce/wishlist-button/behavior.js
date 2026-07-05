/**
 * Wishlist button — toggles saved state and emits wishlist:toggle.
 */
export default function init(root, props) {
  function onClick() {
    const next = root.dataset.saved !== "true";
    root.dataset.saved = String(next);
    root.setAttribute("aria-pressed", String(next));
    root.querySelectorAll("[data-saved]").forEach((el) => { el.dataset.saved = String(next); });
    root.dispatchEvent(new CustomEvent("wishlist:toggle", { bubbles: true, detail: { saved: next } }));
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}
