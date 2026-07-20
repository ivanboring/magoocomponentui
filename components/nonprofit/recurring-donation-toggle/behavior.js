/**
 * Recurring donation toggle - a two-segment one-time/monthly control.
 *
 * Clicking a segment sets the group's data-state (which drives the active styling
 * via group-data utilities), mirrors the choice to aria-pressed on both segments,
 * and fires frequency:change with the chosen { value }. State is read from the DOM
 * (portable init passes no props object); listeners are cleaned up.
 */
export default function init(root) {
  const group = root.querySelector(".recurring-donation-toggle__group");
  const buttons = Array.from(root.querySelectorAll(".recurring-donation-toggle__btn"));
  if (!group || !buttons.length) return () => {};

  function sync() {
    for (const btn of buttons) {
      btn.setAttribute("aria-pressed", btn.dataset.value === group.dataset.state ? "true" : "false");
    }
  }

  function onClick(event) {
    const btn = event.currentTarget;
    if (group.dataset.state === btn.dataset.value) return;
    group.dataset.state = btn.dataset.value;
    sync();
    root.dispatchEvent(new CustomEvent("frequency:change", {
      bubbles: true,
      detail: { value: btn.dataset.value },
    }));
  }

  for (const btn of buttons) btn.addEventListener("click", onClick);
  sync();

  return () => {
    for (const btn of buttons) btn.removeEventListener("click", onClick);
  };
}
