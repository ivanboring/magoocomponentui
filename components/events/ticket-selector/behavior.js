/**
 * ticket-selector behavior — sums ticket-card descendants into a running total.
 * Config comes from data-* attributes (portable init passes no props object).
 */
export default function init(root, props) {
  const totalEl = root.querySelector(".ticket-selector__total");
  const checkoutBtn = root.querySelector(".ticket-selector__checkout");
  if (!totalEl || !checkoutBtn) return () => {};

  const symbol = root.dataset.currencySymbol || "$";

  function recompute() {
    const cards = root.querySelectorAll(".ticket-card");
    let totalCents = 0;
    for (const card of cards) {
      const quantity = Number(card.dataset.quantity) || 0;
      const priceCents = Number(card.dataset.priceCents) || 0;
      totalCents += quantity * priceCents;
    }
    totalEl.textContent = `${symbol}${(totalCents / 100).toFixed(2)}`;
    checkoutBtn.disabled = totalCents <= 0;
  }

  function onChange() {
    recompute();
  }

  root.addEventListener("ticket-card:change", onChange);
  recompute();
  return () => root.removeEventListener("ticket-card:change", onChange);
}
