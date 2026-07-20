/**
 * Submenu dropdown — a JS-toggled root menu whose group items open a cascading flyout to
 * the right. Only the root toggle is wired here: the trigger flips the root's data-open (a
 * group flag the CSS reveals the panel from) and mirrors it onto aria-expanded. The flyouts
 * are pure CSS (group-hover/group-focus-within), so they need no JS. Closes on Escape or an
 * outside click.
 */
export default function init(root) {
  const trigger = root.querySelector(".submenu-dropdown__trigger");
  const menu = root.querySelector(".submenu-dropdown__menu");
  if (!trigger || !menu) return () => {};

  function setOpen(open) {
    root.dataset.open = open ? "true" : "false";
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
  }
  function isOpen() {
    return root.dataset.open === "true";
  }
  function onToggle(event) {
    event.preventDefault();
    setOpen(!isOpen());
  }
  function onOutside(event) {
    if (!root.contains(event.target)) setOpen(false);
  }
  function onKey(event) {
    if (event.key === "Escape" && isOpen()) {
      setOpen(false);
      trigger.focus();
    }
  }

  trigger.addEventListener("click", onToggle);
  document.addEventListener("click", onOutside);
  root.addEventListener("keydown", onKey);
  return () => {
    trigger.removeEventListener("click", onToggle);
    document.removeEventListener("click", onOutside);
    root.removeEventListener("keydown", onKey);
  };
}
