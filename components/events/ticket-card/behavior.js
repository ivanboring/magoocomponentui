/**
 * ticket-card behavior — quantity stepper.
 * Config comes from data-* attributes (portable init passes no props object).
 */
export default function init(root, props) {
  const decrement = root.querySelector(".ticket-card__decrement");
  const increment = root.querySelector(".ticket-card__increment");
  const quantityEl = root.querySelector(".ticket-card__quantity");
  if (!decrement || !increment || !quantityEl) return () => {};

  const max = Number(root.dataset.maxQuantity) || 0;
  const soldOut = root.dataset.status === "sold-out";

  function render(quantity) {
    root.dataset.quantity = String(quantity);
    quantityEl.textContent = String(quantity);
    decrement.disabled = soldOut || quantity <= 0;
    increment.disabled = soldOut || quantity >= max;
  }

  function change(delta) {
    const current = Number(root.dataset.quantity) || 0;
    const next = Math.min(max, Math.max(0, current + delta));
    if (next === current) return;
    render(next);
    root.dispatchEvent(new CustomEvent("ticket-card:change", { bubbles: true }));
  }

  function onDecrement() {
    change(-1);
  }
  function onIncrement() {
    change(1);
  }

  if (soldOut) {
    decrement.setAttribute("aria-disabled", "true");
    increment.setAttribute("aria-disabled", "true");
  }

  render(Number(root.dataset.quantity) || 0);
  decrement.addEventListener("click", onDecrement);
  increment.addEventListener("click", onIncrement);
  return () => {
    decrement.removeEventListener("click", onDecrement);
    increment.removeEventListener("click", onIncrement);
  };
}
