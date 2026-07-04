/**
 * Dropdown menu — click-to-open with outside-click + Escape close and basic
 * ArrowUp/ArrowDown roving focus across menu items.
 */
export default function init(root, props) {
  const trigger = root.querySelector(".menu-dropdown__trigger");
  const menu = root.querySelector(".menu-dropdown__menu");
  if (!trigger || !menu) return () => {};

  const items = () => Array.from(menu.querySelectorAll(".menu-dropdown__item"));

  function open() {
    menu.classList.remove("hidden");
    menu.classList.add("flex");
    trigger.setAttribute("aria-expanded", "true");
    items()[0]?.focus();
  }
  function close() {
    menu.classList.add("hidden");
    menu.classList.remove("flex");
    trigger.setAttribute("aria-expanded", "false");
  }
  function onTrigger() {
    trigger.getAttribute("aria-expanded") === "true" ? close() : open();
  }
  function onOutside(event) {
    if (!root.contains(event.target)) close();
  }
  function onKey(event) {
    const list = items();
    const idx = list.indexOf(document.activeElement);
    if (event.key === "Escape") { close(); trigger.focus(); }
    else if (event.key === "ArrowDown" && idx > -1) { event.preventDefault(); list[(idx + 1) % list.length].focus(); }
    else if (event.key === "ArrowUp" && idx > -1) { event.preventDefault(); list[(idx - 1 + list.length) % list.length].focus(); }
  }

  trigger.addEventListener("click", onTrigger);
  document.addEventListener("click", onOutside);
  root.addEventListener("keydown", onKey);
  return () => {
    trigger.removeEventListener("click", onTrigger);
    document.removeEventListener("click", onOutside);
    root.removeEventListener("keydown", onKey);
  };
}
