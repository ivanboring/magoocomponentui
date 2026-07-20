/**
 * Water intake — the add button logs another serving.
 * Config comes from data-* attributes (portable init passes no props object): data-step is the
 * millilitres per tap. The component is otherwise render-driven (cups + pct are precomputed by the
 * caller), so this only emits an event a host can use to update the count and re-render.
 */
export default function init(root) {
  const add = root.querySelector(".water-intake__add");
  if (!add) return () => {};
  const step = parseInt(root.dataset.step, 10) || 250;

  function onAdd() {
    root.dispatchEvent(new CustomEvent("water:add", { bubbles: true, detail: { amount: step } }));
  }

  add.addEventListener("click", onAdd);
  return () => add.removeEventListener("click", onAdd);
}
