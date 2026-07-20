/**
 * Split button — a primary action with an attached caret that opens a menu of related
 * actions. The caret toggles the root's data-open (a group flag the CSS reveals the menu
 * from) and mirrors it onto the toggle's aria-expanded. Closes on Escape or outside click.
 * The menu items are plain links, so no selection event is dispatched.
 */
export default function init(root) {
  const toggle = root.querySelector(".split-button__toggle");
  const menu = root.querySelector(".split-button__menu");
  if (!toggle || !menu) return () => {};

  function setOpen(open) {
    root.dataset.open = open ? "true" : "false";
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
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
      toggle.focus();
    }
  }

  toggle.addEventListener("click", onToggle);
  document.addEventListener("click", onOutside);
  root.addEventListener("keydown", onKey);
  return () => {
    toggle.removeEventListener("click", onToggle);
    document.removeEventListener("click", onOutside);
    root.removeEventListener("keydown", onKey);
  };
}
