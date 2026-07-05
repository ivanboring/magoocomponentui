/**
 * Matchday selector — clicking a matchday marks it active and emits matchday:change.
 */
export default function init(root, props) {
  function onClick(event) {
    const item = event.target.closest(".matchday-selector__item");
    if (!item) return;
    root.querySelectorAll(".matchday-selector__item").forEach((b) => {
      const on = b === item;
      b.dataset.active = String(on);
      b.setAttribute("aria-current", String(on));
    });
    root.dispatchEvent(new CustomEvent("matchday:change", { bubbles: true, detail: { value: item.dataset.value } }));
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}
