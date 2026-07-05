/**
 * Filter bar — toggle filter chips (multi-select) and clear-all. Emits filter-bar:change
 * with the active labels, and filter-bar:clear.
 */
export default function init(root, props) {
  function active() {
    return Array.from(root.querySelectorAll('.filter-bar__chip[data-active="true"]')).map((c) => c.textContent.trim());
  }
  function onClick(event) {
    const chip = event.target.closest(".filter-bar__chip");
    if (chip) {
      const on = chip.dataset.active !== "true";
      chip.dataset.active = String(on);
      chip.setAttribute("aria-pressed", String(on));
      root.dispatchEvent(new CustomEvent("filter-bar:change", { bubbles: true, detail: { active: active() } }));
      return;
    }
    if (event.target.closest("[data-filter-clear]")) {
      root.querySelectorAll(".filter-bar__chip").forEach((c) => { c.dataset.active = "false"; c.setAttribute("aria-pressed", "false"); });
      root.dispatchEvent(new CustomEvent("filter-bar:clear", { bubbles: true }));
    }
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}
