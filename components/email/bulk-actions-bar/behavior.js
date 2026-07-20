/**
 * Bulk actions bar — each batch action button dispatches bulk:action with its label so a
 * host can run the operation over the current selection. Config-free; the portable init
 * passes no props object.
 */
export default function init(root) {
  function onClick(event) {
    const button = event.target.closest(".bulk-actions-bar__action");
    if (!button) return;
    root.dispatchEvent(
      new CustomEvent("bulk:action", { bubbles: true, detail: { label: button.dataset.label } })
    );
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}
