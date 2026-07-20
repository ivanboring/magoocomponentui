/**
 * Assistant hero — clicking an example chip fills the prompt input with the chip's text, focuses
 * it, and dispatches "prompt:pick"; submitting the form dispatches "prompt:submit" with the
 * current input value (no network calls — a host app wires the events). Cleanup removes every
 * listener.
 */
export default function init(root) {
  const form = root.querySelector(".assistant-hero__form");
  const input = root.querySelector(".assistant-hero__input");
  const chips = Array.from(root.querySelectorAll(".assistant-hero__chip"));

  function onChip(event) {
    const chip = event.currentTarget;
    const value = chip.dataset.prompt || chip.textContent.trim();
    if (input) {
      input.value = value;
      input.focus();
    }
    root.dispatchEvent(new CustomEvent("prompt:pick", { bubbles: true, detail: { value } }));
  }
  function onSubmit(event) {
    event.preventDefault();
    root.dispatchEvent(new CustomEvent("prompt:submit", { bubbles: true, detail: { value: input ? input.value : "" } }));
  }

  chips.forEach((chip) => chip.addEventListener("click", onChip));
  form?.addEventListener("submit", onSubmit);

  return () => {
    chips.forEach((chip) => chip.removeEventListener("click", onChip));
    form?.removeEventListener("submit", onSubmit);
  };
}
