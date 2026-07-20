/**
 * Device tile — the role="switch" toggles the device on/off.
 *
 * On click it flips data-state on the switch (and its knob), mirrors the on/off state onto
 * every [data-on] element (the root tile + icon) so the highlighted style follows, updates
 * aria-checked, and dispatches "device:toggle" with { on }. Config/state is read from data-*
 * attributes (the portable init receives no props object).
 */
export default function init(root) {
  const sw = root.querySelector(".device-tile__switch");
  if (!sw) return () => {};

  function onClick() {
    const on = sw.dataset.state !== "true";
    const v = String(on);
    root.dataset.on = v;
    root.querySelectorAll("[data-on]").forEach((el) => { el.dataset.on = v; });
    root.querySelectorAll("[data-state]").forEach((el) => { el.dataset.state = v; });
    sw.setAttribute("aria-checked", v);
    root.dispatchEvent(new CustomEvent("device:toggle", { bubbles: true, detail: { on } }));
  }

  sw.addEventListener("click", onClick);
  return () => sw.removeEventListener("click", onClick);
}
