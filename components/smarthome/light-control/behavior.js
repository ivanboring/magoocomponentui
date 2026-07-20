/**
 * Light control — power switch + brightness slider.
 * The switch flips data-state on the button and its knob (and aria-checked); the range input drives
 * the fill width and the numeric readout. Both emit a bubbling "light:change" with the current
 * on/brightness. State is read from the DOM (portable init passes no props object).
 */
export default function init(root) {
  const sw = root.querySelector(".light-control__switch");
  const range = root.querySelector(".light-control__range");
  const fill = root.querySelector(".light-control__fill");
  const value = root.querySelector(".light-control__value");

  function emit() {
    root.dispatchEvent(new CustomEvent("light:change", {
      bubbles: true,
      detail: {
        on: sw ? sw.dataset.state === "true" : false,
        brightness: range ? Number(range.value) : 0,
      },
    }));
  }
  function onToggle() {
    const on = sw.dataset.state !== "true";
    root.querySelectorAll("[data-state]").forEach((el) => { el.dataset.state = String(on); });
    sw.setAttribute("aria-checked", String(on));
    emit();
  }
  function onInput() {
    const pct = Number(range.value);
    if (fill) fill.style.width = pct + "%";
    if (value) value.textContent = pct + "%";
    emit();
  }

  sw?.addEventListener("click", onToggle);
  range?.addEventListener("input", onInput);
  return () => {
    sw?.removeEventListener("click", onToggle);
    range?.removeEventListener("input", onInput);
  };
}
