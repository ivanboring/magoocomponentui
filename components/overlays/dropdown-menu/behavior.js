/**
 * Dropdown menu — a slot-supplied trigger opens an actionable menu with ArrowUp/Down
 * roving focus. Selecting an item fires dropdown-menu:select. Closes on outside click
 * or Escape.
 */
export default function init(root, props) {
  const trigger = root.querySelector(".dropdown-menu__trigger");
  const menu = root.querySelector(".dropdown-menu__menu");
  if (!trigger || !menu) return () => {};

  const items = () => Array.from(menu.querySelectorAll(".dropdown-menu__item"));

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
  function toggle() {
    trigger.getAttribute("aria-expanded") === "true" ? close() : open();
  }
  function onTriggerKey(event) {
    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
      event.preventDefault();
      open();
    }
  }
  function onClick(event) {
    const item = event.target.closest(".dropdown-menu__item");
    if (item) {
      root.dispatchEvent(new CustomEvent("dropdown-menu:select", { bubbles: true, detail: { value: item.dataset.value } }));
      close();
      trigger.focus();
    }
  }
  function onOutside(event) { if (!root.contains(event.target)) close(); }
  function onKey(event) {
    const list = items();
    const idx = list.indexOf(document.activeElement);
    if (event.key === "Escape") { close(); trigger.focus(); }
    else if (event.key === "ArrowDown" && idx > -1) { event.preventDefault(); list[(idx + 1) % list.length].focus(); }
    else if (event.key === "ArrowUp" && idx > -1) { event.preventDefault(); list[(idx - 1 + list.length) % list.length].focus(); }
  }

  trigger.addEventListener("click", toggle);
  trigger.addEventListener("keydown", onTriggerKey);
  root.addEventListener("click", onClick);
  document.addEventListener("click", onOutside);
  root.addEventListener("keydown", onKey);
  return () => {
    trigger.removeEventListener("click", toggle);
    trigger.removeEventListener("keydown", onTriggerKey);
    root.removeEventListener("click", onClick);
    document.removeEventListener("click", onOutside);
    root.removeEventListener("keydown", onKey);
  };
}
