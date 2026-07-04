/**
 * Notification banner — dismiss hides the banner and fires notification-banner:dismissed.
 */
export default function init(root, props) {
  const button = root.querySelector(".notification-banner__dismiss");
  if (!button) return () => {};
  function onClick() {
    root.setAttribute("hidden", "");
    root.dispatchEvent(new CustomEvent("notification-banner:dismissed", { bubbles: true }));
  }
  button.addEventListener("click", onClick);
  return () => button.removeEventListener("click", onClick);
}
