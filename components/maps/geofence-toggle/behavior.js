/**
 * Geofence toggle — switch enables/disables the area alert; emits geofence:toggle.
 */
export default function init(root, props) {
  const sw = root.querySelector(".geofence-toggle__switch");
  if (!sw) return () => {};
  function onClick() {
    const on = sw.dataset.on !== "true";
    sw.dataset.on = String(on);
    sw.setAttribute("aria-checked", String(on));
    sw.querySelectorAll("[data-on]").forEach((el) => { el.dataset.on = String(on); });
    root.dispatchEvent(new CustomEvent("geofence:toggle", { bubbles: true, detail: { enabled: on } }));
  }
  sw.addEventListener("click", onClick);
  return () => sw.removeEventListener("click", onClick);
}
