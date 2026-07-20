/**
 * Map/list toggle — a two-button segmented control. Clicking a segment sets the
 * root's data-state (which drives the active styling via group-data utilities),
 * updates aria-selected on both tabs, and fires view:change with the chosen { view }.
 * State is read from the DOM (portable init passes no props object); listeners are
 * cleaned up.
 */
export default function init(root) {
  const buttons = Array.from(root.querySelectorAll(".map-list-toggle__btn"));
  if (!buttons.length) return () => {};

  function sync() {
    const state = root.dataset.state;
    for (const btn of buttons) {
      btn.setAttribute("aria-selected", btn.dataset.view === state ? "true" : "false");
    }
  }

  function onClick(event) {
    const btn = event.currentTarget;
    if (root.dataset.state === btn.dataset.view) return;
    root.dataset.state = btn.dataset.view;
    sync();
    root.dispatchEvent(new CustomEvent("view:change", {
      bubbles: true,
      detail: { view: btn.dataset.view },
    }));
  }

  for (const btn of buttons) btn.addEventListener("click", onClick);
  sync();

  return () => {
    for (const btn of buttons) btn.removeEventListener("click", onClick);
  };
}
