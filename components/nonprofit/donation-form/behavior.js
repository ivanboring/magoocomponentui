/**
 * Donation form — preset amount selection, frequency toggle, and submit.
 *
 * Config is read from the DOM (the portable init passes no props object):
 *   - amount buttons carry data-amount and a data-selected state (single selection);
 *   - the frequency toggle carries data-frequency on its group element (drives the static
 *     group-data-[frequency=…] highlight and is updated on click);
 *   - Donate dispatches "donate:submit" with the current { amount, frequency }.
 * Typing a custom amount clears any selected preset.
 */
export default function init(root) {
  const amountButtons = Array.from(root.querySelectorAll(".donation-form__amount"));
  const custom = root.querySelector(".donation-form__custom");
  const toggle = root.querySelector(".donation-form__toggle");
  const freqButtons = Array.from(root.querySelectorAll(".donation-form__freq"));
  const donate = root.querySelector(".donation-form__donate");

  function selectAmount(btn) {
    amountButtons.forEach((b) => (b.dataset.selected = b === btn ? "true" : "false"));
    if (custom) custom.value = "";
  }
  const amountHandlers = amountButtons.map((btn) => {
    const h = () => selectAmount(btn);
    btn.addEventListener("click", h);
    return h;
  });

  function onCustom() {
    amountButtons.forEach((b) => (b.dataset.selected = "false"));
  }
  custom?.addEventListener("input", onCustom);

  function syncFreq() {
    if (!toggle) return;
    freqButtons.forEach((b) =>
      b.setAttribute("aria-pressed", b.dataset.freq === toggle.dataset.frequency ? "true" : "false"),
    );
  }
  const freqHandlers = freqButtons.map((btn) => {
    const h = () => {
      if (toggle) toggle.dataset.frequency = btn.dataset.freq;
      syncFreq();
    };
    btn.addEventListener("click", h);
    return h;
  });
  syncFreq();

  function currentAmount() {
    const typed = custom && custom.value.trim();
    if (typed) return typed;
    const sel = amountButtons.find((b) => b.dataset.selected === "true");
    return sel ? sel.dataset.amount : "";
  }
  function onDonate() {
    root.dispatchEvent(
      new CustomEvent("donate:submit", {
        bubbles: true,
        detail: { amount: currentAmount(), frequency: toggle ? toggle.dataset.frequency : "" },
      }),
    );
  }
  donate?.addEventListener("click", onDonate);

  return () => {
    amountButtons.forEach((b, i) => b.removeEventListener("click", amountHandlers[i]));
    custom?.removeEventListener("input", onCustom);
    freqButtons.forEach((b, i) => b.removeEventListener("click", freqHandlers[i]));
    donate?.removeEventListener("click", onDonate);
  };
}
