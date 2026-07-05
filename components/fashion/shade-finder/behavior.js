/**
 * Shade finder — single-select undertone and shade; updates the match card and swatch. Emits
 * shade:change.
 */
export default function init(root, props) {
  const matchName = root.querySelector(".shade-finder__match-name");
  const matchSwatch = root.querySelector(".shade-finder__match-swatch");
  function selectWithin(group, btn) {
    group.querySelectorAll('[role="radio"]').forEach((b) => {
      const on = b === btn;
      b.dataset.active = String(on);
      b.setAttribute("aria-checked", String(on));
    });
  }
  // Initialize the match swatch from the active shade.
  const activeShade = root.querySelector('.shade-finder__shade[data-active="true"]');
  if (activeShade && matchSwatch) matchSwatch.style.background = activeShade.style.background;
  function onClick(event) {
    const btn = event.target.closest('[role="radio"]');
    if (!btn) return;
    selectWithin(btn.closest('[role="radiogroup"]'), btn);
    if (btn.classList.contains("shade-finder__shade")) {
      if (matchName) matchName.textContent = btn.dataset.name;
      if (matchSwatch) matchSwatch.style.background = btn.style.background;
    }
    root.dispatchEvent(new CustomEvent("shade:change", { bubbles: true }));
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}
