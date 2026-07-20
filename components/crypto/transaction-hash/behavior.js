/**
 * Transaction hash - copy the full hash to the clipboard.
 * The full hash lives on the copy button's data-hash attribute (portable init passes no props). On
 * click it is written to the clipboard, the icon flips to a check via data-copied, and an sr-only
 * live region announces "Copied!" - both revert after a moment.
 */
export default function init(root) {
  const button = root.querySelector(".transaction-hash__copy");
  if (!button) return () => {};
  const status = root.querySelector(".transaction-hash__status");
  const hash = button.dataset.hash ?? "";

  let timer = 0;
  function onCopy() {
    navigator.clipboard?.writeText(hash)?.then(() => {
      button.dataset.copied = "true";
      button.setAttribute("aria-label", "Copied");
      if (status) status.textContent = "Copied!";
      clearTimeout(timer);
      timer = setTimeout(() => {
        button.dataset.copied = "false";
        button.setAttribute("aria-label", "Copy transaction hash");
        if (status) status.textContent = "";
      }, 1500);
    });
  }

  button.addEventListener("click", onCopy);
  return () => {
    button.removeEventListener("click", onCopy);
    clearTimeout(timer);
  };
}
