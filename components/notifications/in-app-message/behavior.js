/**
 * In-app message — dismiss hides the card and fires in-app-message:dismissed.
 */
export default function init(root, props) {
  const button = root.querySelector(".in-app-message__dismiss");
  if (!button) return () => {};
  function onClick() {
    root.setAttribute("hidden", "");
    root.dispatchEvent(new CustomEvent("in-app-message:dismissed", { bubbles: true }));
  }
  button.addEventListener("click", onClick);
  return () => button.removeEventListener("click", onClick);
}
