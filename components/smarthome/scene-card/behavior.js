/**
 * Scene card — the activate button toggles the scene active state.
 *
 * On click it flips data-active on the button (which drives the label/style via the
 * group-data variants), updates aria-pressed, and dispatches "scene:activate" with { active }
 * so the host can trigger or clear the real scene. State lives on the button's data-active.
 */
export default function init(root) {
  const btn = root.querySelector(".scene-card__activate");
  if (!btn) return () => {};

  function onClick() {
    const active = btn.dataset.active !== "true";
    const v = String(active);
    btn.dataset.active = v;
    btn.setAttribute("aria-pressed", v);
    root.dispatchEvent(new CustomEvent("scene:activate", { bubbles: true, detail: { active } }));
  }

  btn.addEventListener("click", onClick);
  return () => btn.removeEventListener("click", onClick);
}
