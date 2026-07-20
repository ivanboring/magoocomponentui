/**
 * Rating slider — mirrors a native range input into a positioned value bubble and track fill.
 * As the user drags, it recomputes the percentage from min/max/value (the template renders the
 * initial values, which the directive language can't compute) and moves the fill, thumb and
 * bubble, then emits a bubbling "rating:change" event with { value }. Cleans up on teardown.
 */
export default function init(root) {
  const input = root.querySelector(".rating-slider__input");
  const fill = root.querySelector(".rating-slider__fill");
  const thumb = root.querySelector(".rating-slider__thumb");
  const bubble = root.querySelector(".rating-slider__bubble");
  const valueEl = root.querySelector(".rating-slider__value");
  if (!input) return () => {};

  function pct() {
    const min = Number(input.min);
    const max = Number(input.max);
    const v = Number(input.value);
    return max > min ? ((v - min) / (max - min)) * 100 : 0;
  }

  function onInput() {
    const p = pct();
    if (fill) fill.style.width = p + "%";
    if (thumb) thumb.style.left = p + "%";
    if (bubble) bubble.style.left = p + "%";
    if (valueEl) valueEl.textContent = input.value;
    root.dispatchEvent(
      new CustomEvent("rating:change", { bubbles: true, detail: { value: Number(input.value) } }),
    );
  }

  input.addEventListener("input", onInput);
  return () => input.removeEventListener("input", onInput);
}
