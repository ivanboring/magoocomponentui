/**
 * Transfer list — a dual-list picker that moves rows between an available and a chosen list.
 * Clicking a row toggles its selection (data-selected/aria-pressed). The middle controls move
 * rows by DOM transfer: add/remove move the currently selected rows, add-all/remove-all move
 * every row. Each move deselects the moved rows and emits a bubbling "transfer:change" event
 * with the current { available, chosen } value arrays. Config comes from the DOM (portable
 * init passes no props object).
 */
export default function init(root) {
  const availList = root.querySelector('[data-list="available"]');
  const chosenList = root.querySelector('[data-list="chosen"]');
  if (!availList || !chosenList) return () => {};

  const valuesOf = (list) =>
    Array.from(list.querySelectorAll(".transfer-list__row")).map((r) => r.dataset.value);

  function emit() {
    root.dispatchEvent(
      new CustomEvent("transfer:change", {
        bubbles: true,
        detail: { available: valuesOf(availList), chosen: valuesOf(chosenList) },
      }),
    );
  }

  function move(from, to, all) {
    const rows = Array.from(from.querySelectorAll(".transfer-list__row"));
    let moved = 0;
    for (const row of rows) {
      if (!all && row.dataset.selected !== "true") continue;
      row.dataset.selected = "false";
      row.setAttribute("aria-pressed", "false");
      const li = row.closest("li");
      to.appendChild(li || row);
      moved += 1;
    }
    if (moved) emit();
  }

  function onClick(event) {
    const control = event.target.closest(".transfer-list__move");
    if (control && root.contains(control)) {
      const dir = control.dataset.move;
      if (dir === "add") move(availList, chosenList, false);
      else if (dir === "remove") move(chosenList, availList, false);
      else if (dir === "add-all") move(availList, chosenList, true);
      else if (dir === "remove-all") move(chosenList, availList, true);
      return;
    }
    const row = event.target.closest(".transfer-list__row");
    if (row && root.contains(row)) {
      const selected = row.dataset.selected !== "true";
      row.dataset.selected = String(selected);
      row.setAttribute("aria-pressed", String(selected));
    }
  }

  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}
