/**
 * Cuisine filter — single-select cuisine chips; emits cuisine:change.
 */
export default function init(root, props) {
  function onClick(event) {
    const chip = event.target.closest(".cuisine-filter__chip");
    if (!chip) return;
    root.querySelectorAll(".cuisine-filter__chip").forEach((c) => {
      const on = c === chip;
      c.dataset.active = String(on);
      c.setAttribute("aria-pressed", String(on));
    });
    root.dispatchEvent(new CustomEvent("cuisine:change", { bubbles: true, detail: { cuisine: chip.textContent.trim() } }));
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}
