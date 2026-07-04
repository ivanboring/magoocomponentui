/**
 * Snackbar — fires snackbar:action when the action is pressed, then hides.
 */
export default function init(root, props) {
  const action = root.querySelector(".snackbar__action");
  if (!action) return () => {};
  function onClick() {
    root.dispatchEvent(new CustomEvent("snackbar:action", { bubbles: true }));
    root.setAttribute("hidden", "");
  }
  action.addEventListener("click", onClick);
  return () => action.removeEventListener("click", onClick);
}
