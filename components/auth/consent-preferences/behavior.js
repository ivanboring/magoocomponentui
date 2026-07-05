/**
 * Consent preferences — non-required switches toggle their category; required ones are
 * locked on. Emits consent:change.
 */
export default function init(root, props) {
  function onClick(event) {
    const sw = event.target.closest(".consent-preferences__switch");
    if (!sw || sw.dataset.required === "true") return;
    const on = sw.dataset.on !== "true";
    sw.dataset.on = String(on);
    sw.setAttribute("aria-checked", String(on));
    sw.querySelectorAll("[data-on]").forEach((el) => { el.dataset.on = String(on); });
    root.dispatchEvent(new CustomEvent("consent:change", { bubbles: true, detail: { label: sw.getAttribute("aria-label"), enabled: on } }));
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}
