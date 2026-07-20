/**
 * Gas fee selector - a single-choice segmented control over three fee tiers.
 * Selection state is the data-selected attribute on each option (styled via
 * data-[selected=true] utilities); this behavior only wires interaction (portable init passes no
 * props): clicking an option selects it, clears the others, and fires gas:select with { tier }.
 */
export default function init(root) {
  const options = Array.from(root.querySelectorAll(".gas-fee-selector__option"));
  if (!options.length) return () => {};

  function select(option) {
    options.forEach((o) => {
      const on = o === option;
      o.dataset.selected = String(on);
      o.setAttribute("aria-checked", String(on));
    });
    root.dispatchEvent(new CustomEvent("gas:select", {
      bubbles: true,
      detail: { tier: option.dataset.tier },
    }));
  }
  function onClick(event) {
    const option = event.target.closest(".gas-fee-selector__option");
    if (option) select(option);
  }

  root.addEventListener("click", onClick);
  return () => {
    root.removeEventListener("click", onClick);
  };
}
