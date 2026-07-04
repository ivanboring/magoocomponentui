/**
 * Alert behavior — dismiss handling.
 * Config comes from data-* attributes (portable init passes no props object).
 */
export default function init(root, props) {
  const button = root.querySelector(".alert__dismiss");
  if (!button) return () => {};

  function dismiss() {
    root.setAttribute("hidden", "");
    root.dispatchEvent(new CustomEvent("alert:dismissed", { bubbles: true }));
  }
  function onKey(event) {
    if (event.key === "Escape") dismiss();
  }

  button.addEventListener("click", dismiss);
  root.addEventListener("keydown", onKey);
  return () => {
    button.removeEventListener("click", dismiss);
    root.removeEventListener("keydown", onKey);
  };
}
