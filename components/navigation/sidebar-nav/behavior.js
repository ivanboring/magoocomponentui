/**
 * Sidebar nav — collapsible groups. Clicking a group heading toggles its list
 * and rotates the chevron; state is reflected on aria-expanded.
 */
export default function init(root, props) {
  function onClick(event) {
    const toggle = event.target.closest(".sidebar-nav__group-toggle");
    if (!toggle) return;
    const group = toggle.closest(".sidebar-nav__group");
    const list = group.querySelector(".sidebar-nav__list");
    const chevron = toggle.querySelector(".sidebar-nav__chevron");
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    list.classList.toggle("hidden", expanded);
    if (chevron) chevron.classList.toggle("-rotate-90", expanded);
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}
