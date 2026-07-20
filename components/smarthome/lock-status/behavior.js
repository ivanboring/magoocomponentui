/**
 * Lock status — the button toggles the locked state across every [data-locked] element (icon,
 * status labels, button labels) and emits a bubbling "lock:toggle" with the new state.
 * State is read from the DOM (portable init passes no props object).
 */
export default function init(root) {
  const btn = root.querySelector(".lock-status__toggle");
  if (!btn) return () => {};

  function onClick() {
    const locked = btn.dataset.locked !== "true";
    root.querySelectorAll("[data-locked]").forEach((el) => { el.dataset.locked = String(locked); });
    root.dispatchEvent(new CustomEvent("lock:toggle", { bubbles: true, detail: { locked } }));
  }

  btn.addEventListener("click", onClick);
  return () => btn.removeEventListener("click", onClick);
}
