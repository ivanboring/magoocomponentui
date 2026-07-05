/**
 * Mortgage calculator — recomputes the monthly payment live from price, down payment,
 * rate, and term using the standard amortization formula, and emits mortgage:change.
 */
export default function init(root, props) {
  const priceIn = root.querySelector(".mortgage-calculator__price");
  const downIn = root.querySelector(".mortgage-calculator__down");
  const rateIn = root.querySelector(".mortgage-calculator__rate");
  const termIn = root.querySelector(".mortgage-calculator__term");
  const result = root.querySelector(".mortgage-calculator__result");
  const priceOut = root.querySelector(".mortgage-calculator__price-out");
  const downOut = root.querySelector(".mortgage-calculator__down-out");
  if (!priceIn || !result) return () => {};

  const money = (n) => "$" + Math.round(n).toLocaleString("en-US");
  function compute() {
    const price = Number(priceIn.value);
    const down = Number(downIn.value);
    const rate = Number(rateIn.value) / 100 / 12;
    const months = Number(termIn.value) * 12;
    const principal = price * (1 - down / 100);
    const monthly = rate > 0
      ? principal * (rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1)
      : principal / months;
    if (priceOut) priceOut.textContent = money(price);
    if (downOut) downOut.textContent = down + "%";
    result.firstChild.textContent = money(monthly);
    root.dispatchEvent(new CustomEvent("mortgage:change", { bubbles: true, detail: { monthly: Math.round(monthly) } }));
  }
  const inputs = [priceIn, downIn, rateIn, termIn].filter(Boolean);
  inputs.forEach((el) => el.addEventListener("input", compute));
  compute();
  return () => inputs.forEach((el) => el.removeEventListener("input", compute));
}
