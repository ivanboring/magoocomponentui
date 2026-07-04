/**
 * Drawer — close on the backdrop, any [data-drawer-close] control, or Escape.
 */
export default function init(root, props) {
  function close() {
    root.dataset.open = "false";
    root.dispatchEvent(new CustomEvent("drawer:close", { bubbles: true }));
  }
  function onClick(event) {
    if (event.target.closest("[data-drawer-close]")) close();
  }
  function onKey(event) {
    if (event.key === "Escape" && root.dataset.open !== "false") close();
  }
  root.addEventListener("click", onClick);
  document.addEventListener("keydown", onKey);
  return () => {
    root.removeEventListener("click", onClick);
    document.removeEventListener("keydown", onKey);
  };
}
