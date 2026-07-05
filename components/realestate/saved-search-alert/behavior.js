/**
 * Saved search alert — toggle switch enables/disables alerts and emits alert:toggle.
 */
export default function init(root, props) {
  const sw = root.querySelector(".saved-search-alert__toggle");
  if (!sw) return () => {};
  function onClick() {
    const on = sw.dataset.on !== "true";
    sw.dataset.on = String(on);
    sw.setAttribute("aria-checked", String(on));
    sw.querySelectorAll("[data-on]").forEach((el) => { el.dataset.on = String(on); });
    root.dispatchEvent(new CustomEvent("alert:toggle", { bubbles: true, detail: { enabled: on } }));
  }
  sw.addEventListener("click", onClick);
  return () => sw.removeEventListener("click", onClick);
}
