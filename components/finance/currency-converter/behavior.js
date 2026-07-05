/**
 * Currency converter — multiplies the amount by data-rate live and emits currency:convert.
 */
export default function init(root, props) {
  const amount = root.querySelector(".currency-converter__amount");
  const result = root.querySelector(".currency-converter__result");
  const rate = Number(root.dataset.rate) || 0;
  if (!amount || !result) return () => {};
  function compute() {
    const value = parseFloat(amount.value.replace(/,/g, "")) || 0;
    const out = value * rate;
    result.textContent = out.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    root.dispatchEvent(new CustomEvent("currency:convert", { bubbles: true, detail: { result: out } }));
  }
  amount.addEventListener("input", compute);
  compute();
  return () => amount.removeEventListener("input", compute);
}
