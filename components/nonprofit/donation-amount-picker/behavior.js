/**
 * Donation amount picker — single-select preset buttons with an optional custom amount.
 *
 * Config is read from the DOM (the portable init passes no props object): each button carries
 * data-amount and a data-selected state. Clicking a button selects it (clearing the others and
 * any custom value) and dispatches a bubbling "amount:select" CustomEvent { amount }. Typing in
 * the custom input clears the preset selection.
 */
export default function init(root) {
  const buttons = Array.from(root.querySelectorAll(".donation-amount-picker__amount"));
  const custom = root.querySelector(".donation-amount-picker__custom");

  function select(btn) {
    buttons.forEach((b) => (b.dataset.selected = b === btn ? "true" : "false"));
    if (custom) custom.value = "";
    root.dispatchEvent(
      new CustomEvent("amount:select", { bubbles: true, detail: { amount: btn.dataset.amount } }),
    );
  }
  const handlers = buttons.map((btn) => {
    const h = () => select(btn);
    btn.addEventListener("click", h);
    return h;
  });

  function onCustom() {
    buttons.forEach((b) => (b.dataset.selected = "false"));
  }
  custom?.addEventListener("input", onCustom);

  return () => {
    buttons.forEach((b, i) => b.removeEventListener("click", handlers[i]));
    custom?.removeEventListener("input", onCustom);
  };
}
