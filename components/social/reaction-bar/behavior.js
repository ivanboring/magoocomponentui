/**
 * Reaction bar — clicking a reaction toggles it and adjusts its count by ±1, emitting
 * reaction:toggle.
 */
export default function init(root, props) {
  function onClick(event) {
    const pill = event.target.closest(".reaction-bar__pill");
    if (!pill) return;
    const on = pill.dataset.reacted !== "true";
    pill.dataset.reacted = String(on);
    pill.setAttribute("aria-pressed", String(on));
    const countEl = pill.querySelector(".reaction-bar__count");
    if (countEl) {
      const n = parseInt(countEl.textContent, 10);
      if (!Number.isNaN(n)) countEl.textContent = String(Math.max(0, n + (on ? 1 : -1)));
    }
    root.dispatchEvent(new CustomEvent("reaction:toggle", { bubbles: true, detail: { reacted: on } }));
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}
