/**
 * Auto finance calculator — amortized monthly payment from price − down over term at APR.
 * Mode toggle (finance/lease) is presentational here; emits autofinance:change.
 */
export default function init(root, props) {
  const price = root.querySelector(".finance-calculator-auto__price");
  const down = root.querySelector(".finance-calculator-auto__down");
  const rate = root.querySelector(".finance-calculator-auto__rate");
  const term = root.querySelector(".finance-calculator-auto__term");
  const out = root.querySelector(".finance-calculator-auto__out");
  const priceOut = root.querySelector(".finance-calculator-auto__price-out");
  const downOut = root.querySelector(".finance-calculator-auto__down-out");
  if (!price || !out) return () => {};
  const money = (n) => "$" + Math.round(n).toLocaleString("en-US");
  function compute() {
    const principal = Math.max(0, Number(price.value) - Number(down.value));
    const r = Number(rate.value) / 100 / 12;
    const n = Number(term.value);
    const monthly = r > 0 ? principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : principal / n;
    if (priceOut) priceOut.textContent = money(Number(price.value));
    if (downOut) downOut.textContent = money(Number(down.value));
    out.firstChild.textContent = money(monthly);
    root.dispatchEvent(new CustomEvent("autofinance:change", { bubbles: true, detail: { monthly: Math.round(monthly) } }));
  }
  const inputs = [price, down, rate, term].filter(Boolean);
  inputs.forEach((el) => el.addEventListener("input", compute));
  function onMode(event) {
    const btn = event.target.closest(".finance-calculator-auto__mode");
    if (!btn) return;
    root.querySelectorAll(".finance-calculator-auto__mode").forEach((m) => {
      const on = m === btn;
      m.dataset.active = String(on);
      m.setAttribute("aria-pressed", String(on));
    });
  }
  root.addEventListener("click", onMode);
  compute();
  return () => {
    inputs.forEach((el) => el.removeEventListener("input", compute));
    root.removeEventListener("click", onMode);
  };
}
