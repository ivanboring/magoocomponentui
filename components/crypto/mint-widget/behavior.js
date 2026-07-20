/**
 * Mint widget behavior — quantity stepper + mint action.
 * Config comes from the DOM (portable init passes no props object):
 *   .mint-widget__qty[data-max]        upper clamp (optional)
 *   .mint-widget__total[data-unit-price] per-item price for the running total
 * The stepper clamps quantity to 1..max; Mint dispatches a bubbling "mint:submit"
 * CustomEvent with { quantity }.
 */
export default function init(root) {
  const input = root.querySelector(".mint-widget__qty");
  if (!input) return () => {};

  const dec = root.querySelector(".mint-widget__dec");
  const inc = root.querySelector(".mint-widget__inc");
  const total = root.querySelector(".mint-widget__total");
  const mint = root.querySelector(".mint-widget__mint");

  const maxRaw = Number(input.getAttribute("data-max"));
  const max = Number.isFinite(maxRaw) && maxRaw > 0 ? Math.floor(maxRaw) : Infinity;
  const unitPrice = total ? Number(total.getAttribute("data-unit-price")) : NaN;

  function clamp(n) {
    if (!Number.isFinite(n) || n < 1) return 1;
    return Math.min(Math.floor(n), max);
  }
  function getQty() {
    return clamp(Number(input.value));
  }
  function render() {
    const qty = getQty();
    input.value = String(qty);
    if (total && Number.isFinite(unitPrice)) {
      const t = unitPrice * qty;
      total.textContent = Number.isInteger(t)
        ? String(t)
        : t.toFixed(4).replace(/\.?0+$/, "");
    }
  }
  function step(delta) {
    input.value = String(getQty() + delta);
    render();
  }

  function onDec() {
    step(-1);
  }
  function onInc() {
    step(1);
  }
  function onChange() {
    render();
  }
  function onMint() {
    root.dispatchEvent(
      new CustomEvent("mint:submit", {
        bubbles: true,
        detail: { quantity: getQty() },
      })
    );
  }

  if (dec) dec.addEventListener("click", onDec);
  if (inc) inc.addEventListener("click", onInc);
  input.addEventListener("change", onChange);
  if (mint) mint.addEventListener("click", onMint);
  render();

  return () => {
    if (dec) dec.removeEventListener("click", onDec);
    if (inc) inc.removeEventListener("click", onInc);
    input.removeEventListener("change", onChange);
    if (mint) mint.removeEventListener("click", onMint);
  };
}
