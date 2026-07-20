/**
 * Feeding schedule — clicking a meal toggle flips its fed state.
 * The done state lives as data-done on the meal row (styled via group-data-[done]
 * utilities); this behavior flips it, syncs aria-pressed, and emits feeding:toggle.
 * Config comes from data-* attributes (portable init passes no props object).
 */
export default function init(root) {
  function onClick(event) {
    const button = event.target.closest(".feeding-schedule__toggle");
    if (!button) return;
    const meal = button.closest(".feeding-schedule__meal");
    if (!meal) return;
    const done = meal.dataset.done !== "true";
    meal.dataset.done = String(done);
    button.setAttribute("aria-pressed", String(done));
    root.dispatchEvent(new CustomEvent("feeding:toggle", { bubbles: true, detail: { done } }));
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}
