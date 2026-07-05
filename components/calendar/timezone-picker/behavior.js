/**
 * Timezone picker — opens the list, selects a zone (updates the toggle), closes on outside
 * click or Escape. Emits timezone:change.
 */
export default function init(root, props) {
  const toggle = root.querySelector(".timezone-picker__toggle");
  const menu = root.querySelector(".timezone-picker__menu");
  const selected = root.querySelector(".timezone-picker__selected span:last-child");
  if (!toggle || !menu) return () => {};
  function open() { menu.classList.remove("hidden"); menu.classList.add("flex"); toggle.setAttribute("aria-expanded", "true"); }
  function close() { menu.classList.add("hidden"); menu.classList.remove("flex"); toggle.setAttribute("aria-expanded", "false"); }
  function onToggle() { toggle.getAttribute("aria-expanded") === "true" ? close() : open(); }
  function onMenu(event) {
    const zone = event.target.closest(".timezone-picker__zone");
    if (!zone) return;
    menu.querySelectorAll(".timezone-picker__zone").forEach((z) => { z.dataset.active = String(z === zone); z.setAttribute("aria-selected", String(z === zone)); });
    if (selected) selected.textContent = zone.querySelector("span").textContent;
    close();
    root.dispatchEvent(new CustomEvent("timezone:change", { bubbles: true, detail: { zone: zone.querySelector("span").textContent } }));
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
