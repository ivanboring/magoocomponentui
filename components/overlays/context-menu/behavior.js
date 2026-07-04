/**
 * Context menu — opens at the pointer on right-click of the target area; selecting an
 * item fires context-menu:select. Closes on outside click, Escape, or scroll.
 */
export default function init(root, props) {
  const target = root.querySelector(".context-menu__target");
  const menu = root.querySelector(".context-menu__menu");
  if (!target || !menu) return () => {};

  function openAt(x, y) {
    menu.classList.remove("hidden");
    menu.classList.add("flex");
    const { width, height } = menu.getBoundingClientRect();
    menu.style.left = Math.min(x, window.innerWidth - width - 8) + "px";
    menu.style.top = Math.min(y, window.innerHeight - height - 8) + "px";
  }
  function close() {
    menu.classList.add("hidden");
    menu.classList.remove("flex");
  }
  function onContext(event) {
    event.preventDefault();
    openAt(event.clientX, event.clientY);
  }
  function onClick(event) {
    const item = event.target.closest(".context-menu__item");
    if (item) {
      root.dispatchEvent(new CustomEvent("context-menu:select", { bubbles: true, detail: { value: item.dataset.value } }));
      close();
    } else if (!menu.contains(event.target)) {
      close();
    }
  }
  function onKey(event) { if (event.key === "Escape") close(); }

  target.addEventListener("contextmenu", onContext);
  document.addEventListener("click", onClick);
  document.addEventListener("keydown", onKey);
  window.addEventListener("scroll", close, { passive: true });
  return () => {
    target.removeEventListener("contextmenu", onContext);
    document.removeEventListener("click", onClick);
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("scroll", close);
  };
}
