/**
 * Sort dropdown — open/close menu, select an option (updates the toggle label), close on
 * outside click or Escape. Emits sort:change.
 */
export default function init(root, props) {
  const toggle = root.querySelector(".sort-dropdown__toggle");
  const menu = root.querySelector(".sort-dropdown__menu");
  const current = root.querySelector(".sort-dropdown__toggle .font-medium");
  if (!toggle || !menu) return () => {};

  function open() { menu.classList.remove("hidden"); menu.classList.add("flex"); toggle.setAttribute("aria-expanded", "true"); }
  function close() { menu.classList.add("hidden"); menu.classList.remove("flex"); toggle.setAttribute("aria-expanded", "false"); }
  function onToggle() { toggle.getAttribute("aria-expanded") === "true" ? close() : open(); }
  function onMenu(event) {
    const opt = event.target.closest(".sort-dropdown__option");
    if (!opt) return;
    menu.querySelectorAll(".sort-dropdown__option").forEach((o) => { o.dataset.active = String(o === opt); o.setAttribute("aria-checked", String(o === opt)); });
    if (current) current.textContent = opt.textContent.trim();
    close();
    root.dispatchEvent(new CustomEvent("sort:change", { bubbles: true, detail: { value: opt.dataset.value } }));
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
