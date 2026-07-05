/**
 * Availability scheduler — day toggles enable/disable a day's availability; emits
 * availability:toggle.
 */
export default function init(root, props) {
  function onClick(event) {
    const sw = event.target.closest('[role="switch"]');
    if (!sw) return;
    const on = sw.dataset.on !== "true";
    sw.dataset.on = String(on);
    sw.setAttribute("aria-checked", String(on));
    sw.querySelectorAll("[data-on]").forEach((el) => { el.dataset.on = String(on); });
    const day = sw.closest(".availability-scheduler__day");
    if (day) day.dataset.enabled = String(on);
    root.dispatchEvent(new CustomEvent("availability:toggle", { bubbles: true, detail: { day: sw.getAttribute("aria-label"), enabled: on } }));
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}
