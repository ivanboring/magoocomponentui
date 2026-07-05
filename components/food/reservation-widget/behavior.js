/**
 * Reservation widget — single-select party size and time chips; emits reservation:submit.
 */
export default function init(root, props) {
  function selectWithin(group, chip) {
    group.querySelectorAll("[role=radio]").forEach((c) => {
      const on = c === chip;
      c.dataset.active = String(on);
      c.setAttribute("aria-checked", String(on));
    });
  }
  function onClick(event) {
    const chip = event.target.closest("[role=radio]");
    if (chip) selectWithin(chip.closest("[role=radiogroup]"), chip);
  }
  function onSubmit(event) { event.preventDefault(); root.dispatchEvent(new CustomEvent("reservation:submit", { bubbles: true })); }
  root.addEventListener("click", onClick);
  root.addEventListener("submit", onSubmit);
  return () => {
    root.removeEventListener("click", onClick);
    root.removeEventListener("submit", onSubmit);
  };
}
