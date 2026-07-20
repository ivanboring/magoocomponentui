/**
 * Prompt suggestions behavior — clicking a chip emits its label.
 * Each chip carries its prompt text on data-label (portable init passes no props). A click
 * dispatches a bubbling "prompt:pick" CustomEvent with { label } so a composer can prefill it.
 */
export default function init(root) {
  const chips = Array.from(root.querySelectorAll(".prompt-suggestions__chip"));

  const handlers = chips.map((chip) => {
    const handler = () => {
      root.dispatchEvent(
        new CustomEvent("prompt:pick", { bubbles: true, detail: { label: chip.dataset.label || chip.textContent.trim() } })
      );
    };
    chip.addEventListener("click", handler);
    return handler;
  });

  return () => {
    chips.forEach((chip, i) => chip.removeEventListener("click", handlers[i]));
  };
}
