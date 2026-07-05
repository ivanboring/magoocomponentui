/**
 * Venue seat picker — clicking an available seat toggles selection; taken/aisle inert.
 * Emits seat:select / seat:deselect.
 */
export default function init(root, props) {
  function onClick(event) {
    const seat = event.target.closest(".seat-picker-venue__seat");
    if (!seat) return;
    const status = seat.dataset.status;
    if (status === "taken" || status === "aisle") return;
    const nowSelected = status !== "selected";
    seat.dataset.status = nowSelected ? "selected" : "available";
    seat.setAttribute("aria-pressed", String(nowSelected));
    root.dispatchEvent(new CustomEvent(nowSelected ? "seat:select" : "seat:deselect", { bubbles: true, detail: { seat: seat.getAttribute("aria-label") } }));
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}
