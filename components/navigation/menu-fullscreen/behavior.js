/**
 * Fullscreen menu — opens a modal overlay, traps nothing heavy but restores focus,
 * closes on the close button, Escape, or a link click.
 */
export default function init(root, props) {
  const openBtn = root.querySelector(".menu-fullscreen__open");
  const closeBtn = root.querySelector(".menu-fullscreen__close");
  const overlay = root.querySelector(".menu-fullscreen__overlay");
  if (!openBtn || !overlay) return () => {};

  function open() {
    overlay.classList.remove("hidden");
    overlay.classList.add("flex");
    openBtn.setAttribute("aria-expanded", "true");
    (closeBtn || overlay).focus?.();
    document.addEventListener("keydown", onKey);
  }
  function close() {
    overlay.classList.add("hidden");
    overlay.classList.remove("flex");
    openBtn.setAttribute("aria-expanded", "false");
    openBtn.focus();
    document.removeEventListener("keydown", onKey);
  }
  function onKey(event) {
    if (event.key === "Escape") close();
  }
  function onLinkClick(event) {
    if (event.target.closest(".menu-fullscreen__link")) close();
  }

  openBtn.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  overlay.addEventListener("click", onLinkClick);
  return () => {
    openBtn.removeEventListener("click", open);
    closeBtn?.removeEventListener("click", close);
    overlay.removeEventListener("click", onLinkClick);
    document.removeEventListener("keydown", onKey);
  };
}
