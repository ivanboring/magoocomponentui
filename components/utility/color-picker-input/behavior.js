/**
 * Colour picker input — keeps a native swatch, a hex text field and preset swatches in sync.
 *
 * Editing the native colour input, typing a valid hex in the text field, or clicking a preset all
 * update the shared value: the swatch and hex field are synced (without clobbering the field the
 * user is typing in) and a bubbling "color:change" event fires with the normalized hex. Config and
 * state live in the DOM (data-value on the root); the portable init passes no props object.
 */
export default function init(root) {
  const swatch = root.querySelector(".color-picker-input__swatch");
  const hex = root.querySelector(".color-picker-input__hex");
  const presets = Array.from(root.querySelectorAll(".color-picker-input__preset"));

  function normalize(raw) {
    if (!raw) return null;
    let v = raw.trim();
    if (v[0] !== "#") v = "#" + v;
    if (/^#[0-9a-fA-F]{3}$/.test(v)) {
      v = "#" + v.slice(1).split("").map((c) => c + c).join("");
    }
    return /^#[0-9a-fA-F]{6}$/.test(v) ? v.toLowerCase() : null;
  }

  function setValue(raw, emit) {
    const v = normalize(raw);
    if (!v) return;
    root.dataset.value = v;
    if (swatch && swatch.value.toLowerCase() !== v) swatch.value = v;
    if (hex && document.activeElement !== hex) hex.value = v;
    if (emit) {
      root.dispatchEvent(new CustomEvent("color:change", { bubbles: true, detail: { value: v } }));
    }
  }

  function onSwatch() {
    setValue(swatch.value, true);
  }
  function onHexInput() {
    setValue(hex.value, true);
  }
  function onHexBlur() {
    // Snap the field back to the canonical value if the user left it mid-edit / invalid.
    if (hex) hex.value = root.dataset.value || hex.value;
  }
  const presetHandlers = presets.map((btn) => {
    const handler = () => setValue(btn.dataset.color, true);
    btn.addEventListener("click", handler);
    return handler;
  });

  swatch?.addEventListener("input", onSwatch);
  hex?.addEventListener("input", onHexInput);
  hex?.addEventListener("blur", onHexBlur);

  return () => {
    swatch?.removeEventListener("input", onSwatch);
    hex?.removeEventListener("input", onHexInput);
    hex?.removeEventListener("blur", onHexBlur);
    presets.forEach((btn, i) => btn.removeEventListener("click", presetHandlers[i]));
  };
}
