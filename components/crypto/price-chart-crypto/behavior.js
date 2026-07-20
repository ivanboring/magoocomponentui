/**
 * Price chart crypto behavior — range-tab selection.
 * Config comes from the DOM (portable init passes no props object).
 * Clicking a range tab moves the active state across the tabs and dispatches a
 * bubbling "range:change" CustomEvent with { label }.
 */
export default function init(root) {
  const buttons = Array.from(root.querySelectorAll(".price-chart-crypto__range"));
  if (!buttons.length) return () => {};

  function onClick(event) {
    const btn = event.currentTarget;
    for (const b of buttons) {
      const active = b === btn;
      b.setAttribute("data-active", String(active));
      b.setAttribute("aria-selected", String(active));
    }
    root.dispatchEvent(
      new CustomEvent("range:change", {
        bubbles: true,
        detail: { label: btn.textContent.trim() },
      })
    );
  }

  for (const b of buttons) b.addEventListener("click", onClick);
  return () => {
    for (const b of buttons) b.removeEventListener("click", onClick);
  };
}
