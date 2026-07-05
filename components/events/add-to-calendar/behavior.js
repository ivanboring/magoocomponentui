/**
 * Add to calendar — opens/closes the provider menu, closes on outside click or Escape.
 */
export default function init(root, props) {
  const toggle = root.querySelector(".add-to-calendar__toggle");
  const menu = root.querySelector(".add-to-calendar__menu");
  if (!toggle || !menu) return () => {};
  function open() { menu.classList.remove("hidden"); menu.classList.add("flex"); toggle.setAttribute("aria-expanded", "true"); }
  function close() { menu.classList.add("hidden"); menu.classList.remove("flex"); toggle.setAttribute("aria-expanded", "false"); }
  function onToggle() { toggle.getAttribute("aria-expanded") === "true" ? close() : open(); }
  function onOutside(event) { if (!root.contains(event.target)) close(); }
  function onKey(event) { if (event.key === "Escape") { close(); toggle.focus(); } }
  toggle.addEventListener("click", onToggle);
  document.addEventListener("click", onOutside);
  root.addEventListener("keydown", onKey);
  return () => {
    toggle.removeEventListener("click", onToggle);
    document.removeEventListener("click", onOutside);
    root.removeEventListener("keydown", onKey);
  };
}
