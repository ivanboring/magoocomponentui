/**
 * API token list — copy-to-clipboard on each token's copy button.
 * Each item carries the (masked) token on the <code data-token>; clicking Copy writes it to the
 * clipboard and briefly swaps the button label to "Copied!". Config comes from the DOM, not props.
 */
export default function init(root) {
  const buttons = Array.from(root.querySelectorAll(".api-token-list__copy"));
  const handlers = [];
  const timers = new Map();

  buttons.forEach((button) => {
    const item = button.closest(".api-token-list__item");
    const code = item ? item.querySelector(".api-token-list__token") : null;
    const label = button.querySelector(".api-token-list__copy-label");

    async function onClick() {
      const text = code ? code.dataset.token || code.textContent.trim() : "";
      try {
        await navigator.clipboard?.writeText(text);
      } catch {
        /* clipboard unavailable — still show feedback */
      }
      if (label) {
        label.textContent = "Copied!";
        clearTimeout(timers.get(button));
        timers.set(
          button,
          setTimeout(() => {
            label.textContent = "Copy";
          }, 1500)
        );
      }
    }

    button.addEventListener("click", onClick);
    handlers.push([button, onClick]);
  });

  return () => {
    handlers.forEach(([button, onClick]) => button.removeEventListener("click", onClick));
    timers.forEach((t) => clearTimeout(t));
  };
}
