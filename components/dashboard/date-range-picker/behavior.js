/**
 * Date range picker — opens the preset menu, selects a range (updates the toggle label),
 * closes on outside click or Escape. Emits daterange:change.
 */
export default function init(root, props) {
  const toggle = root.querySelector(".date-range-picker__toggle");
  const menu = root.querySelector(".date-range-picker__menu");
  const current = root.querySelector(".date-range-picker__current");
  if (!toggle || !menu) return () => {};

  function open() { menu.classList.remove("hidden"); menu.classList.add("flex"); toggle.setAttribute("aria-expanded", "true"); }
  function close() { menu.classList.add("hidden"); menu.classList.remove("flex"); toggle.setAttribute("aria-expanded", "false"); }
  function onToggle() { toggle.getAttribute("aria-expanded") === "true" ? close() : open(); }
  function onMenu(event) {
    const preset = event.target.closest(".date-range-picker__preset");
    if (!preset) return;
    menu.querySelectorAll(".date-range-picker__preset").forEach((p) => { p.dataset.active = String(p === preset); p.setAttribute("aria-checked", String(p === preset)); });
    if (current) current.textContent = preset.textContent.trim();
    close();
    root.dispatchEvent(new CustomEvent("daterange:change", { bubbles: true, detail: { value: preset.dataset.value } }));
  }
  function onOutside(event) { if (!root.contains(event.target)) close(); }
  function onKey(event) { if (event.key === "Escape") { close(); toggle.focus(); } }

  toggle.addEventListener("click", onToggle);
  menu.addEventListener("click", onMenu);
  document.addEventListener("click", onOutside);
  root.addEventListener("keydown", onKey);
  return () => {
    toggle.removeEventListener("click", onToggle);
    menu.removeEventListener("click", onMenu);
    document.removeEventListener("click", onOutside);
    root.removeEventListener("keydown", onKey);
  };
}
