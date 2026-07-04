export default function init(root, props) {
  function onClick(event) {
    if (root.dataset.disabled === "true") {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    const href = root.dataset.href;
    if (href) window.location.assign(href);
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}
