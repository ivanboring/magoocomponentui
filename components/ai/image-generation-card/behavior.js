/**
 * Image generation card — the download / regenerate / variations icon buttons each dispatch
 * "image:action" with their data-action name so a host app can handle them. Cleanup removes the
 * listeners.
 */
export default function init(root) {
  const actions = Array.from(root.querySelectorAll(".image-generation-card__action"));
  function onClick(event) {
    const action = event.currentTarget.dataset.action;
    root.dispatchEvent(new CustomEvent("image:action", { bubbles: true, detail: { action } }));
  }
  actions.forEach((btn) => btn.addEventListener("click", onClick));
  return () => actions.forEach((btn) => btn.removeEventListener("click", onClick));
}
