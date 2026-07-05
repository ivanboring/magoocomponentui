/**
 * Event schedule — track filter chips (multi-select); emits schedule:filter. Actual
 * filtering of sessions is left to the host.
 */
export default function init(root, props) {
  function onClick(event) {
    const chip = event.target.closest(".event-schedule__filter");
    if (!chip) return;
    const on = chip.dataset.active !== "true";
    chip.dataset.active = String(on);
    chip.setAttribute("aria-pressed", String(on));
    const active = Array.from(root.querySelectorAll('.event-schedule__filter[data-active="true"]')).map((c) => c.textContent.trim());
    root.dispatchEvent(new CustomEvent("schedule:filter", { bubbles: true, detail: { active } }));
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}
