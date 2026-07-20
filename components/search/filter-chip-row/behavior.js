/**
 * Filter chip row — remove individual active filters or clear them all.
 *
 * Each chip's × button hides its chip (via the element's `hidden` property, never a `hidden`
 * utility class) and dispatches a bubbling "filter:remove" event carrying the chip's data-value.
 * The trailing clear button hides every chip and itself and dispatches "filter:clear". Rendering
 * and re-querying results is the host page's job — this only manages the chips' own visibility.
 * Config comes from data-* attributes (portable init passes no props object).
 */
export default function init(root) {
  const chips = Array.from(root.querySelectorAll(".filter-chip-row__chip"));
  const removeButtons = Array.from(root.querySelectorAll(".filter-chip-row__remove"));
  const clearButton = root.querySelector(".filter-chip-row__clear");

  const onRemove = (event) => {
    const button = event.currentTarget;
    const chip = button.closest(".filter-chip-row__chip");
    const value = button.dataset.value || "";
    if (chip) chip.hidden = true;
    root.dispatchEvent(new CustomEvent("filter:remove", { bubbles: true, detail: { value } }));
  };

  const onClear = () => {
    for (const chip of chips) chip.hidden = true;
    if (clearButton) clearButton.hidden = true;
    root.dispatchEvent(new CustomEvent("filter:clear", { bubbles: true }));
  };

  for (const button of removeButtons) button.addEventListener("click", onRemove);
  clearButton?.addEventListener("click", onClear);

  return () => {
    for (const button of removeButtons) button.removeEventListener("click", onRemove);
    clearButton?.removeEventListener("click", onClear);
  };
}
