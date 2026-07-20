/**
 * Tip jar — preset amount selection and send.
 *
 * Clicking a preset selects it exclusively (data-selected drives the styling) and clears the
 * custom input; typing a custom amount deselects the presets. "Send tip" dispatches a bubbling
 * tip:send event with the chosen amount (custom input wins over the selected preset).
 * Config comes from the rendered DOM (portable init passes no props object).
 */
export default function init(root) {
  const amounts = Array.from(root.querySelectorAll(".tip-jar__amount"));
  const input = root.querySelector(".tip-jar__input");
  const send = root.querySelector(".tip-jar__send");

  let selected = amounts.find((b) => b.dataset.selected === "true")?.dataset.value || null;

  function selectPreset(btn) {
    selected = btn.dataset.value;
    amounts.forEach((b) => (b.dataset.selected = String(b === btn)));
    if (input) input.value = "";
  }
  function onClick(event) {
    const btn = event.target.closest(".tip-jar__amount");
    if (btn) selectPreset(btn);
  }
  function onInput() {
    if (input.value) {
      selected = null;
      amounts.forEach((b) => (b.dataset.selected = "false"));
    }
  }
  function onSend() {
    const amount = input && input.value ? input.value : selected;
    root.dispatchEvent(new CustomEvent("tip:send", { bubbles: true, detail: { amount } }));
  }

  root.addEventListener("click", onClick);
  input?.addEventListener("input", onInput);
  send?.addEventListener("click", onSend);

  return () => {
    root.removeEventListener("click", onClick);
    input?.removeEventListener("input", onInput);
    send?.removeEventListener("click", onSend);
  };
}
