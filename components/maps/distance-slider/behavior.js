/**
 * Distance slider — updates the radius readout live and emits distance:change.
 */
export default function init(root, props) {
  const input = root.querySelector(".distance-slider__input");
  const out = root.querySelector(".distance-slider__out");
  if (!input || !out) return () => {};
  function onInput() {
    out.textContent = input.value;
    root.dispatchEvent(new CustomEvent("distance:change", { bubbles: true, detail: { value: Number(input.value), unit: root.dataset.unit } }));
  }
  input.addEventListener("input", onInput);
  return () => input.removeEventListener("input", onInput);
}
