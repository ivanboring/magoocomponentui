/**
 * Sort and view toolbar — grid/list layout toggle.
 *
 * The two view buttons set the active layout by writing data-state ("grid" | "list") on the root;
 * the buttons' active styling is pure CSS (group-data-[state=…] variants), so the toggle looks
 * right with no JS and only the interaction is wired here. Clicking a button updates data-state,
 * reflects aria-pressed, and dispatches a bubbling "view:change" event with the chosen view. The
 * native <select> emits its own "change" event; the host reads it directly.
 * Config comes from data-* attributes (portable init passes no props object).
 */
export default function init(root) {
  const buttons = Array.from(root.querySelectorAll("[data-view]"));
  if (!buttons.length) return () => {};

  const reflect = () => {
    const state = root.dataset.state || "grid";
    for (const button of buttons) {
      button.setAttribute("aria-pressed", button.dataset.view === state ? "true" : "false");
    }
  };

  const onClick = (event) => {
    const view = event.currentTarget.dataset.view;
    if (!view || view === root.dataset.state) return;
    root.dataset.state = view;
    reflect();
    root.dispatchEvent(new CustomEvent("view:change", { bubbles: true, detail: { view } }));
  };

  for (const button of buttons) button.addEventListener("click", onClick);
  reflect();

  return () => {
    for (const button of buttons) button.removeEventListener("click", onClick);
  };
}
