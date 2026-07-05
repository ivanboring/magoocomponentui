/**
 * Pricing tiers — the monthly/annual toggle switches the active period and emits
 * pricing:period. Price swapping itself (elements with data-monthly / data-annual) is
 * applied to any such elements found in the slotted plans.
 */
export default function init(root, props) {
  const buttons = Array.from(root.querySelectorAll(".pricing-tiers__period"));
  if (!buttons.length) return () => {};
  function select(period) {
    buttons.forEach((b) => {
      const on = b.dataset.period === period;
      b.dataset.active = String(on);
      b.setAttribute("aria-pressed", String(on));
    });
    root.querySelectorAll("[data-monthly][data-annual]").forEach((el) => {
      el.textContent = period === "annual" ? el.dataset.annual : el.dataset.monthly;
    });
    root.dispatchEvent(new CustomEvent("pricing:period", { bubbles: true, detail: { period } }));
  }
  function onClick(event) {
    const btn = event.target.closest(".pricing-tiers__period");
    if (btn) select(btn.dataset.period);
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}
