/**
 * Load-more grid — reveal hidden cards a step at a time.
 *
 * The grid layout is pure CSS (responsive grid-cols). This behavior hides items past the initial
 * count and reveals the next `step` on each button click, moving focus to the first newly-shown
 * card for keyboard/screen-reader users. When no hidden items remain (or none were hidden to begin
 * with) the button is removed from the flow via the `hidden` attribute.
 * Config comes from data-* attributes (portable init passes no props object).
 */
export default function init(root) {
  const items = Array.from(root.querySelectorAll(".load-more-grid__item"));
  const button = root.querySelector(".load-more-grid__more");
  if (!button) return () => {};

  const initial = parseInt(root.dataset.initial, 10) || items.length;
  const step = parseInt(root.dataset.step, 10) || items.length;

  let shown = Math.min(initial, items.length);
  items.forEach((item, i) => {
    if (i >= shown) item.setAttribute("hidden", "");
    else item.removeAttribute("hidden");
  });

  const syncButton = () => {
    if (shown >= items.length) button.setAttribute("hidden", "");
    else button.removeAttribute("hidden");
  };

  const reveal = () => {
    const firstNew = shown;
    const next = Math.min(shown + step, items.length);
    for (let i = shown; i < next; i++) items[i].removeAttribute("hidden");
    shown = next;
    syncButton();
    const focusTarget = items[firstNew];
    if (focusTarget) {
      const link = focusTarget.querySelector("a, button, [tabindex]");
      (link || focusTarget).focus?.();
    }
  };

  button.addEventListener("click", reveal);
  syncButton();

  return () => {
    button.removeEventListener("click", reveal);
  };
}
