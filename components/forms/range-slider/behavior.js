/**
 * Range slider — mirrors the native range value into the readout and emits range:change.
 */
export default function init(root, props) {
  const input = root.querySelector(".range-slider__input");
  const current = root.querySelector(".range-slider__current");
  if (!input) return () => {};
  function onInput() {
    if (current) current.textContent = input.value;
    root.dispatchEvent(new CustomEvent("range:change", { bubbles: true, detail: { value: Number(input.value) } }));
  }
  input.addEventListener("input", onInput);
  return () => input.removeEventListener("input", onInput);
}
