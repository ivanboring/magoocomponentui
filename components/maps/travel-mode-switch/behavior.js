/**
 * Travel mode switch — single-select drive/walk/transit/bike; emits travelmode:change.
 */
export default function init(root, props) {
  function onClick(event) {
    const mode = event.target.closest(".travel-mode-switch__mode");
    if (!mode) return;
    root.querySelectorAll(".travel-mode-switch__mode").forEach((m) => {
      const on = m === mode;
      m.dataset.active = String(on);
      m.setAttribute("aria-checked", String(on));
    });
    root.dispatchEvent(new CustomEvent("travelmode:change", { bubbles: true, detail: { mode: mode.getAttribute("aria-label") } }));
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}
