/**
 * Announcement bar — dismiss hides the bar and fires announcement-bar:dismissed.
 */
export default function init(root, props) {
  const button = root.querySelector(".announcement-bar__dismiss");
  if (!button) return () => {};
  function onClick() {
    root.setAttribute("hidden", "");
    root.dispatchEvent(new CustomEvent("announcement-bar:dismissed", { bubbles: true }));
  }
  button.addEventListener("click", onClick);
  return () => button.removeEventListener("click", onClick);
}
