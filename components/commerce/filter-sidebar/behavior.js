/**
 * Filter sidebar — emits filter:change on any checkbox toggle and filter:clear on
 * "Clear all" (which unchecks everything).
 */
export default function init(root, props) {
  function collect() {
    return Array.from(root.querySelectorAll(".filter-sidebar__checkbox:checked")).map((c) => c.dataset.value);
  }
  function onChange(event) {
    if (event.target.classList.contains("filter-sidebar__checkbox")) {
      root.dispatchEvent(new CustomEvent("filter:change", { bubbles: true, detail: { selected: collect() } }));
    }
  }
  function onClick(event) {
    if (event.target.closest("[data-filter-clear]")) {
      root.querySelectorAll(".filter-sidebar__checkbox").forEach((c) => { c.checked = false; });
      root.dispatchEvent(new CustomEvent("filter:clear", { bubbles: true }));
    }
  }
  root.addEventListener("change", onChange);
  root.addEventListener("click", onClick);
  return () => {
    root.removeEventListener("change", onChange);
    root.removeEventListener("click", onClick);
  };
}
