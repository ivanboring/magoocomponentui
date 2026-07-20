/**
 * API key card - reveal, copy, and rotate a secret.
 * The masked and real values live on the value element's data-masked / data-key attributes
 * (portable init passes no props object). Reveal toggles the field text between them (and the eye
 * icon via data-revealed); copy writes the real key to the clipboard and swaps the label to
 * "Copied!"; rotate dispatches an apikey:rotate event for the host page to handle.
 */
export default function init(root) {
  const value = root.querySelector(".api-key-card__value");
  if (!value) return () => {};
  const reveal = root.querySelector(".api-key-card__reveal");
  const copyBtn = root.querySelector(".api-key-card__copy");
  const copyLabel = root.querySelector(".api-key-card__copy-label");
  const rotate = root.querySelector(".api-key-card__rotate");

  const masked = value.dataset.masked ?? "";
  const key = value.dataset.key ?? "";

  function onReveal() {
    const revealed = reveal.dataset.revealed !== "true";
    reveal.dataset.revealed = String(revealed);
    reveal.setAttribute("aria-pressed", String(revealed));
    reveal.setAttribute("aria-label", revealed ? "Hide key" : "Reveal key");
    value.textContent = revealed ? key : masked;
  }

  let timer = 0;
  function onCopy() {
    navigator.clipboard?.writeText(key)?.then(() => {
      if (copyLabel) copyLabel.textContent = "Copied!";
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (copyLabel) copyLabel.textContent = "Copy";
      }, 1500);
    });
  }

  function onRotate() {
    root.dispatchEvent(new CustomEvent("apikey:rotate", { bubbles: true }));
  }

  reveal?.addEventListener("click", onReveal);
  copyBtn?.addEventListener("click", onCopy);
  rotate?.addEventListener("click", onRotate);
  return () => {
    reveal?.removeEventListener("click", onReveal);
    copyBtn?.removeEventListener("click", onCopy);
    rotate?.removeEventListener("click", onRotate);
    clearTimeout(timer);
  };
}
