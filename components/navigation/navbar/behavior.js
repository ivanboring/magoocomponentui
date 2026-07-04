export default function init(root, props) {
  const toggle = root.querySelector(".navbar__toggle");
  const panel = root.querySelector(".navbar__mobile-panel");
  if (!toggle || !panel) return () => {};

  function onClick() {
    const isOpen = panel.classList.toggle("flex");
    panel.classList.toggle("hidden", !isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  }

  toggle.addEventListener("click", onClick);
  return () => toggle.removeEventListener("click", onClick);
}
