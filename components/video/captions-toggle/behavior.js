/**
 * Captions toggle — click toggles CC on/off; a long-press-free language menu opens on
 * right-click or when captions are on and clicked again. Emits captions:toggle and
 * captions:language.
 */
export default function init(root, props) {
  const button = root.querySelector(".captions-toggle__button");
  const menu = root.querySelector(".captions-toggle__menu");
  if (!button) return () => {};

  function onClick() {
    const enabled = button.dataset.enabled !== "true";
    button.dataset.enabled = String(enabled);
    button.setAttribute("aria-pressed", String(enabled));
    root.dispatchEvent(new CustomEvent("captions:toggle", { bubbles: true, detail: { enabled } }));
  }
  function onContext(event) {
    if (!menu) return;
    event.preventDefault();
    menu.classList.toggle("hidden");
    menu.classList.toggle("flex");
  }
  function onMenuClick(event) {
    const lang = event.target.closest(".captions-toggle__lang");
    if (lang) {
      root.dispatchEvent(new CustomEvent("captions:language", { bubbles: true, detail: { value: lang.dataset.value } }));
      menu.classList.add("hidden");
      menu.classList.remove("flex");
    }
  }
  function onOutside(event) { if (menu && !root.contains(event.target)) { menu.classList.add("hidden"); menu.classList.remove("flex"); } }

  button.addEventListener("click", onClick);
  button.addEventListener("contextmenu", onContext);
  menu?.addEventListener("click", onMenuClick);
  document.addEventListener("click", onOutside);
  return () => {
    button.removeEventListener("click", onClick);
    button.removeEventListener("contextmenu", onContext);
    menu?.removeEventListener("click", onMenuClick);
    document.removeEventListener("click", onOutside);
  };
}
