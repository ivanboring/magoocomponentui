export default function init(root, props) {
  const button = root.querySelector(".tag__remove");
  if (!button) return () => {};
  function onClick() {
    root.dispatchEvent(new CustomEvent("tag:remove", { bubbles: true }));
    root.remove();
  }
  button.addEventListener("click", onClick);
  return () => button.removeEventListener("click", onClick);
}
