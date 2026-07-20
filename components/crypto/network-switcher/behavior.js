/**
 * Network switcher - a chain dropdown.
 * Open/closed state is data-open on the root (revealed via the group-data-[open=true] utilities in
 * the template); this behavior only wires interaction (portable init passes no props):
 *   - the trigger toggles the dropdown;
 *   - choosing a chain updates the current marker and trigger label, fires network:switch with
 *     { network }, and closes;
 *   - Escape or an outside click closes.
 */
export default function init(root) {
  const trigger = root.querySelector(".network-switcher__trigger");
  const menu = root.querySelector(".network-switcher__menu");
  const label = root.querySelector(".network-switcher__current-label");
  if (!trigger || !menu) return () => {};

  const options = () => Array.from(menu.querySelectorAll(".network-switcher__option"));
  const isOpen = () => root.dataset.open === "true";
  function setOpen(open) {
    root.dataset.open = String(open);
    trigger.setAttribute("aria-expanded", String(open));
  }
  function open() {
    setOpen(true);
    (options().find((o) => o.dataset.current === "true") || options()[0])?.focus();
  }
  function close() {
    setOpen(false);
  }
  function toggle() {
    isOpen() ? close() : open();
  }
  function select(option) {
    options().forEach((o) => {
      const on = o === option;
      o.dataset.current = String(on);
      o.setAttribute("aria-selected", String(on));
      o.querySelector("svg[data-current]").dataset.current = String(on);
    });
    if (label) label.textContent = option.dataset.network;
    root.dispatchEvent(new CustomEvent("network:switch", {
      bubbles: true,
      detail: { network: option.dataset.network },
    }));
    close();
    trigger.focus();
  }
  function onClick(event) {
    const option = event.target.closest(".network-switcher__option");
    if (option) select(option);
  }
  function onOutside(event) {
    if (!root.contains(event.target)) close();
  }
  function onKey(event) {
    if (event.key === "Escape" && isOpen()) {
      close();
      trigger.focus();
    }
  }

  trigger.addEventListener("click", toggle);
  menu.addEventListener("click", onClick);
  document.addEventListener("click", onOutside);
  root.addEventListener("keydown", onKey);
  return () => {
    trigger.removeEventListener("click", toggle);
    menu.removeEventListener("click", onClick);
    document.removeEventListener("click", onOutside);
    root.removeEventListener("keydown", onKey);
  };
}
