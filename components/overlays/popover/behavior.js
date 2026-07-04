/**
 * Popover — toggles an anchored panel on trigger click; closes on outside click or Escape.
 */
export default function init(root, props) {
  const trigger = root.querySelector(".popover__trigger");
  const panel = root.querySelector(".popover__panel");
  if (!trigger || !panel) return () => {};

  function toggle() { panel.classList.toggle("hidden"); }
  function onOutside(event) { if (!root.contains(event.target)) panel.classList.add("hidden"); }
  function onKey(event) { if (event.key === "Escape") panel.classList.add("hidden"); }

  trigger.addEventListener("click", toggle);
  document.addEventListener("click", onOutside);
  root.addEventListener("keydown", onKey);
  return () => {
    trigger.removeEventListener("click", toggle);
    document.removeEventListener("click", onOutside);
    root.removeEventListener("keydown", onKey);
  };
}
