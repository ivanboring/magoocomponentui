/**
 * Seat map — clicking an available seat selects it (toggle); taken seats are inert. Emits
 * seat:select / seat:deselect with the seat id.
 */
export default function init(root, props) {
  function onClick(event) {
    const seat = event.target.closest(".seat-map__seat");
    if (!seat) return;
    const status = seat.dataset.status;
    if (status === "taken" || status === "aisle") return;
    const nowSelected = status !== "selected";
    seat.dataset.status = nowSelected ? "selected" : "available";
    seat.setAttribute("aria-pressed", String(nowSelected));
    root.dispatchEvent(new CustomEvent(nowSelected ? "seat:select" : "seat:deselect", { bubbles: true, detail: { seat: seat.dataset.seat } }));
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}
