/**
 * Toggle switch — flips on/off state and emits toggle:change with the field name.
 */
export default function init(root, props) {
  const sw = root.querySelector(".form-field-toggle__switch");
  const knob = root.querySelector(".form-field-toggle__knob");
  if (!sw) return () => {};
  function onClick() {
    const on = sw.dataset.on !== "true";
    sw.dataset.on = String(on);
    sw.setAttribute("aria-checked", String(on));
    if (knob) knob.dataset.on = String(on);
    root.dispatchEvent(new CustomEvent("toggle:change", { bubbles: true, detail: { name: sw.dataset.name, on } }));
  }
  sw.addEventListener("click", onClick);
  return () => sw.removeEventListener("click", onClick);
}
