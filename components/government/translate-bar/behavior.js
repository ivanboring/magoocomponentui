/**
 * Translate bar — language selection strip.
 *
 * Clicking a language button marks it current (updating data-current + aria-pressed on every
 * button) and dispatches a bubbling "lang:change" CustomEvent with { code, label } so the host
 * page can swap the interface language. Config comes entirely from each button's data-* attributes
 * (the portable init passes no props object).
 */
export default function init(root) {
  const buttons = Array.from(root.querySelectorAll(".translate-bar__lang"));
  if (!buttons.length) return () => {};

  function select(button) {
    buttons.forEach((b) => {
      const on = b === button;
      b.dataset.current = String(on);
      b.setAttribute("aria-pressed", String(on));
    });
    root.dispatchEvent(
      new CustomEvent("lang:change", {
        bubbles: true,
        detail: { code: button.dataset.code, label: button.dataset.label },
      }),
    );
  }

  const handlers = buttons.map((button) => {
    const h = () => select(button);
    button.addEventListener("click", h);
    return h;
  });

  return () => {
    buttons.forEach((button, i) => button.removeEventListener("click", handlers[i]));
  };
}
