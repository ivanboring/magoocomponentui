/**
 * Seat map — clicking an available seat toggles selection; taken/aisle seats are inert.
 *
 * When `data-max-choices` (> 0) is set on the root, at most that many seats can be selected
 * at once: once the limit is reached, selecting another available seat is blocked (the user
 * must deselect one first) and a `seat:max` event fires. A live "N of MAX seats selected"
 * counter is kept in `.seat-map__status`.
 *
 * Emits (bubbles): seat:select / seat:deselect ({ seat }), and seat:max ({ max }) when a
 * pick is blocked by the limit.
 */
export default function init(root) {
  const max = Number(root.dataset.maxChoices) || 0;
  const statusEl = root.querySelector(".seat-map__status");
  let flashTimer = null;

  const selectedCount = () => root.querySelectorAll('.seat-map__seat[data-status="selected"]').length;

  function updateStatus() {
    if (!statusEl || max <= 0) return;
    const n = selectedCount();
    statusEl.textContent = `${n} of ${max} seat${max === 1 ? "" : "s"} selected`;
    statusEl.dataset.full = String(n >= max);
  }

  function flash() {
    if (!statusEl) return;
    statusEl.dataset.flash = "true";
    if (flashTimer) clearTimeout(flashTimer);
    flashTimer = setTimeout(() => { statusEl.dataset.flash = "false"; }, 500);
  }

  function onClick(event) {
    const seat = event.target.closest(".seat-map__seat");
    if (!seat) return;
    const status = seat.dataset.status;
    if (status === "taken" || status === "aisle") return;

    if (status !== "selected") {
      if (max > 0 && selectedCount() >= max) {
        root.dispatchEvent(new CustomEvent("seat:max", { bubbles: true, detail: { max } }));
        flash();
        return;
      }
      seat.dataset.status = "selected";
      seat.setAttribute("aria-pressed", "true");
      root.dispatchEvent(new CustomEvent("seat:select", { bubbles: true, detail: { seat: seat.dataset.seat } }));
    } else {
      seat.dataset.status = "available";
      seat.setAttribute("aria-pressed", "false");
      root.dispatchEvent(new CustomEvent("seat:deselect", { bubbles: true, detail: { seat: seat.dataset.seat } }));
    }
    updateStatus();
  }

  root.addEventListener("click", onClick);
  updateStatus();

  return () => {
    root.removeEventListener("click", onClick);
    if (flashTimer) clearTimeout(flashTimer);
  };
}
