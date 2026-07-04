/**
 * Modal — close on the backdrop, any [data-modal-close] control, or Escape.
 * Open state is reflected on data-open (the template hides it when false).
 */
export default function init(root, props) {
  function close() {
    root.dataset.open = "false";
    root.dispatchEvent(new CustomEvent("modal:close", { bubbles: true }));
  }
  function onClick(event) {
    if (event.target.closest("[data-modal-close]")) close();
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
