/**
 * Appointment booker — single-select day and available time; emits appointment:confirm.
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
    if (!chip) return;
    if (chip.dataset.available === "false") return;
    selectWithin(chip.closest("[role=radiogroup]"), chip);
  }
  function onSubmit(event) { event.preventDefault(); root.dispatchEvent(new CustomEvent("appointment:confirm", { bubbles: true })); }
  root.addEventListener("click", onClick);
  root.addEventListener("submit", onSubmit);
  return () => {
    root.removeEventListener("click", onClick);
    root.removeEventListener("submit", onSubmit);
  };
}
