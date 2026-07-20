/**
 * Toggle setting row - flips a switch on/off and reports the change.
 * State lives on the switch button's data-state attribute (CSS colours the track and slides the
 * knob via data-[state=true]); portable init passes no props object. Clicking flips data-state,
 * mirrors it onto the knob, updates aria-checked, and dispatches setting:toggle with { name, on }.
 */
export default function init(root) {
  const sw = root.querySelector(".toggle-setting-row__switch");
  const knob = root.querySelector(".toggle-setting-row__knob");
  if (!sw) return () => {};

  function onClick() {
    const on = sw.dataset.state !== "true";
    sw.dataset.state = String(on);
    sw.setAttribute("aria-checked", String(on));
    if (knob) knob.dataset.state = String(on);
    root.dispatchEvent(new CustomEvent("setting:toggle", { bubbles: true, detail: { name: sw.dataset.name, on } }));
  }

  sw.addEventListener("click", onClick);
  return () => sw.removeEventListener("click", onClick);
}
