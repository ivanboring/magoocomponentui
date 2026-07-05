/**
 * Pricing toggle — single-select monthly/annual; emits pricing:period.
 */
export default function init(root, props) {
  function onClick(event) {
    const opt = event.target.closest(".pricing-toggle__opt");
    if (!opt) return;
    root.querySelectorAll(".pricing-toggle__opt").forEach((o) => {
      const on = o === opt;
      o.dataset.active = String(on);
      o.setAttribute("aria-checked", String(on));
    });
    root.dispatchEvent(new CustomEvent("pricing:period", { bubbles: true, detail: { period: opt.dataset.period } }));
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}
