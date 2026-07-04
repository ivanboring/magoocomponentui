/**
 * Confirm dialog — emits confirm-dialog:confirm / :cancel and closes. Escape and the
 * backdrop cancel. Config-free: the buttons carry data-confirm-ok / data-confirm-cancel.
 */
export default function init(root, props) {
  function close(kind) {
    root.dataset.open = "false";
    root.dispatchEvent(new CustomEvent(`confirm-dialog:${kind}`, { bubbles: true }));
  }
  function onClick(event) {
    if (event.target.closest("[data-confirm-ok]")) close("confirm");
    else if (event.target.closest("[data-confirm-cancel]")) close("cancel");
  }
  function onKey(event) {
    if (event.key === "Escape" && root.dataset.open !== "false") close("cancel");
  }
  root.addEventListener("click", onClick);
  document.addEventListener("keydown", onKey);
  return () => {
    root.removeEventListener("click", onClick);
    document.removeEventListener("keydown", onKey);
  };
}
