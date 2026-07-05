/**
 * Vehicle color picker — single-select swatch; updates the selected name and emits
 * color:change.
 */
export default function init(root, props) {
  const nameOut = root.querySelector(".color-picker-vehicle__name");
  function onClick(event) {
    const swatch = event.target.closest(".color-picker-vehicle__swatch");
    if (!swatch) return;
    root.querySelectorAll(".color-picker-vehicle__swatch").forEach((s) => {
      const on = s === swatch;
      s.dataset.active = String(on);
      s.setAttribute("aria-checked", String(on));
    });
    if (nameOut) nameOut.textContent = swatch.dataset.name;
    root.dispatchEvent(new CustomEvent("color:change", { bubbles: true, detail: { name: swatch.dataset.name } }));
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}
