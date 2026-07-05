/**
 * Color swatch row — single-select swatch (sold-out inert); updates the name, emits
 * swatch:change.
 */
export default function init(root, props) {
  const nameOut = root.querySelector(".color-swatch-row__name");
  function onClick(event) {
    const swatch = event.target.closest(".color-swatch-row__swatch");
    if (!swatch || swatch.dataset.soldout === "true") return;
    root.querySelectorAll(".color-swatch-row__swatch").forEach((s) => {
      const on = s === swatch;
      s.dataset.active = String(on);
      s.setAttribute("aria-checked", String(on));
    });
    if (nameOut) nameOut.textContent = swatch.dataset.name;
    root.dispatchEvent(new CustomEvent("swatch:change", { bubbles: true, detail: { name: swatch.dataset.name } }));
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}
