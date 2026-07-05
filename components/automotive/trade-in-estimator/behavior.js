/**
 * Trade-in estimator — single-select condition chips; emits tradein:estimate on submit.
 */
export default function init(root, props) {
  function onClick(event) {
    const chip = event.target.closest('[role="radio"]');
    if (!chip) return;
    root.querySelectorAll('[role="radio"]').forEach((c) => {
      const on = c === chip;
      c.dataset.active = String(on);
      c.setAttribute("aria-checked", String(on));
    });
  }
  function onSubmit(event) { event.preventDefault(); root.dispatchEvent(new CustomEvent("tradein:estimate", { bubbles: true })); }
  root.addEventListener("click", onClick);
  root.addEventListener("submit", onSubmit);
  return () => {
    root.removeEventListener("click", onClick);
    root.removeEventListener("submit", onSubmit);
  };
}
