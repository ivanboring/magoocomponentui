/**
 * Floor plan viewer — level toggle switches the active level and emits floorplan:level.
 */
export default function init(root, props) {
  function onClick(event) {
    const btn = event.target.closest(".floor-plan-viewer__level");
    if (!btn) return;
    root.querySelectorAll(".floor-plan-viewer__level").forEach((b) => {
      const on = b === btn;
      b.dataset.active = String(on);
      b.setAttribute("aria-pressed", String(on));
    });
    root.dispatchEvent(new CustomEvent("floorplan:level", { bubbles: true, detail: { level: btn.textContent.trim() } }));
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}
