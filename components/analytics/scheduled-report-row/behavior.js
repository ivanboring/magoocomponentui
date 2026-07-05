/**
 * Scheduled report row — toggle enables/disables the schedule; emits report:toggle.
 */
export default function init(root, props) {
  const sw = root.querySelector(".scheduled-report-row__toggle");
  if (!sw) return () => {};
  function onClick() {
    const on = sw.dataset.on !== "true";
    sw.dataset.on = String(on);
    sw.setAttribute("aria-checked", String(on));
    sw.querySelectorAll("[data-on]").forEach((el) => { el.dataset.on = String(on); });
    root.dataset.enabled = String(on);
    root.querySelectorAll("[data-enabled]").forEach((el) => { el.dataset.enabled = String(on); });
    root.dispatchEvent(new CustomEvent("report:toggle", { bubbles: true, detail: { enabled: on } }));
  }
  sw.addEventListener("click", onClick);
  return () => sw.removeEventListener("click", onClick);
}
