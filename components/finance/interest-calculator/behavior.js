/**
 * Interest calculator — compounds annually (P(1+r)^n) live and emits interest:change.
 */
export default function init(root, props) {
  const principal = root.querySelector(".interest-calculator__principal");
  const rate = root.querySelector(".interest-calculator__rate");
  const years = root.querySelector(".interest-calculator__years");
  const out = root.querySelector(".interest-calculator__out");
  const principalOut = root.querySelector(".interest-calculator__principal-out");
  if (!principal || !out) return () => {};
  const money = (n) => "$" + Math.round(n).toLocaleString("en-US");
  function compute() {
    const p = Number(principal.value);
    const r = Number(rate.value) / 100;
    const n = Number(years.value);
    const balance = p * Math.pow(1 + r, n);
    if (principalOut) principalOut.textContent = money(p);
    out.textContent = money(balance);
    root.dispatchEvent(new CustomEvent("interest:change", { bubbles: true, detail: { balance: Math.round(balance) } }));
  }
  const inputs = [principal, rate, years].filter(Boolean);
  inputs.forEach((el) => el.addEventListener("input", compute));
  compute();
  return () => inputs.forEach((el) => el.removeEventListener("input", compute));
}
