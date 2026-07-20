/**
 * Swap widget - reports intent to swap or flip the token direction.
 * The layout (from/to panels, the flip button, rate and slippage lines) is static markup; this
 * behavior only wires the two actions (portable init passes no props):
 *   - the Swap button fires swap:submit with the current from/to amounts and symbols;
 *   - the flip button fires swap:flip.
 * The host page performs the actual swap and re-renders.
 */
export default function init(root) {
  const submit = root.querySelector(".swap-widget__submit");
  const flip = root.querySelector(".swap-widget__flip");
  const fromAmount = root.querySelector(".swap-widget__from-amount");
  const toAmount = root.querySelector(".swap-widget__to-amount");
  const fromToken = root.querySelector(".swap-widget__from-token");
  const toToken = root.querySelector(".swap-widget__to-token");

  function onSubmit() {
    root.dispatchEvent(new CustomEvent("swap:submit", {
      bubbles: true,
      detail: {
        from: { symbol: fromToken?.textContent.trim(), amount: fromAmount?.value },
        to: { symbol: toToken?.textContent.trim(), amount: toAmount?.value },
      },
    }));
  }
  function onFlip() {
    root.dispatchEvent(new CustomEvent("swap:flip", { bubbles: true }));
  }

  submit?.addEventListener("click", onSubmit);
  flip?.addEventListener("click", onFlip);
  return () => {
    submit?.removeEventListener("click", onSubmit);
    flip?.removeEventListener("click", onFlip);
  };
}
