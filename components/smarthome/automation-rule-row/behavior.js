/**
 * Automation rule row — the role="switch" enables/disables the rule.
 *
 * On click it flips data-state on the switch (and its knob), updates aria-checked, and dispatches
 * "rule:toggle" with { enabled } so the host can activate or pause the automation. State is read
 * from the switch's data-state; the portable init receives no props object.
 */
export default function init(root) {
  const sw = root.querySelector(".automation-rule-row__switch");
  if (!sw) return () => {};

  function onClick() {
    const enabled = sw.dataset.state !== "true";
    const v = String(enabled);
    sw.querySelectorAll("[data-state]").forEach((el) => { el.dataset.state = v; });
    sw.dataset.state = v;
    sw.setAttribute("aria-checked", v);
    root.dispatchEvent(new CustomEvent("rule:toggle", { bubbles: true, detail: { enabled } }));
  }

  sw.addEventListener("click", onClick);
  return () => sw.removeEventListener("click", onClick);
}
