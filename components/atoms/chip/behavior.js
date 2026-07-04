export default function init(root, props) {
  function onClick() {
    const selected = root.dataset.selected === "true";
    root.dataset.selected = String(!selected);
    root.setAttribute("aria-pressed", String(!selected));
    root.dispatchEvent(new CustomEvent("chip:toggle", { bubbles: true, detail: { selected: !selected } }));
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}
